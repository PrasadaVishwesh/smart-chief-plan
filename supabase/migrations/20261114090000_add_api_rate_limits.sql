CREATE TABLE public.api_rate_limit_buckets (
  endpoint text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count > 0),
  PRIMARY KEY (endpoint, user_id)
);

ALTER TABLE public.api_rate_limit_buckets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.api_rate_limit_buckets FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_rate_limit_buckets TO service_role;

CREATE FUNCTION public.consume_api_rate_limit(
  p_endpoint text,
  p_user_id uuid,
  p_limit integer,
  p_window_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_window_started_at timestamptz;
  v_request_count integer;
BEGIN
  IF p_endpoint IS NULL
    OR p_endpoint !~ '^[a-z0-9-]{1,64}$'
    OR p_user_id IS NULL
    OR p_limit IS NULL
    OR p_limit < 1
    OR p_limit > 10000
    OR p_window_seconds IS NULL
    OR p_window_seconds < 1
    OR p_window_seconds > 86400
  THEN
    RAISE EXCEPTION 'Invalid rate limit parameters';
  END IF;

  INSERT INTO public.api_rate_limit_buckets (
    endpoint,
    user_id,
    window_started_at,
    request_count
  )
  VALUES (p_endpoint, p_user_id, v_now, 1)
  ON CONFLICT (endpoint, user_id) DO UPDATE
  SET
    window_started_at = CASE
      WHEN public.api_rate_limit_buckets.window_started_at
        <= v_now - make_interval(secs => p_window_seconds)
      THEN v_now
      ELSE public.api_rate_limit_buckets.window_started_at
    END,
    request_count = CASE
      WHEN public.api_rate_limit_buckets.window_started_at
        <= v_now - make_interval(secs => p_window_seconds)
      THEN 1
      ELSE least(public.api_rate_limit_buckets.request_count + 1, p_limit + 1)
    END
  RETURNING window_started_at, request_count
  INTO v_window_started_at, v_request_count;

  RETURN jsonb_build_object(
    'allowed', v_request_count <= p_limit,
    'limit', p_limit,
    'remaining', greatest(0, p_limit - v_request_count),
    'retry_after_seconds', greatest(
      1,
      ceil(extract(epoch FROM (
        v_window_started_at + make_interval(secs => p_window_seconds) - v_now
      )))::integer
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_api_rate_limit(text, uuid, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_api_rate_limit(text, uuid, integer, integer)
  TO service_role;

CREATE FUNCTION public.enforce_user_write_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  v_result := public.consume_api_rate_limit(
    'user-write',
    v_user_id,
    120,
    60
  );

  IF NOT (v_result->>'allowed')::boolean THEN
    RAISE SQLSTATE 'PT429' USING MESSAGE = 'Write rate limit exceeded.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_user_write_rate_limit() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER favorites_write_rate_limit
BEFORE INSERT OR UPDATE OR DELETE ON public.favorites
FOR EACH ROW EXECUTE FUNCTION public.enforce_user_write_rate_limit();

CREATE TRIGGER meal_plans_write_rate_limit
BEFORE INSERT OR UPDATE OR DELETE ON public.meal_plans
FOR EACH ROW EXECUTE FUNCTION public.enforce_user_write_rate_limit();
