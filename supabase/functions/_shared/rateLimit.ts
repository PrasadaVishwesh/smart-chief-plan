type WindowState = { startedAt: number; count: number };

export function createRateLimiter(maxRequests: number, windowMs: number, now: () => number = Date.now) {
  const windows = new Map<string, WindowState>();

  return (key: string): boolean => {
    const currentTime = now();
    const current = windows.get(key);

    if (!current || currentTime - current.startedAt >= windowMs) {
      windows.set(key, { startedAt: currentTime, count: 1 });
      return true;
    }

    if (current.count >= maxRequests) return false;
    current.count += 1;
    return true;
  };
}