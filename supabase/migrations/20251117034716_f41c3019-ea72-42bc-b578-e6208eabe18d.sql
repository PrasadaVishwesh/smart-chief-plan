-- Add rating to favorites table
ALTER TABLE public.favorites
ADD COLUMN rating integer DEFAULT NULL CHECK (rating >= 1 AND rating <= 5);

-- Add notes to meal_plans table
ALTER TABLE public.meal_plans
ADD COLUMN notes text DEFAULT NULL;