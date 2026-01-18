-- Add missing UPDATE policy to favorites table
-- This allows users to update ratings on their favorite recipes
CREATE POLICY "Users can update their own favorites" 
ON public.favorites 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);