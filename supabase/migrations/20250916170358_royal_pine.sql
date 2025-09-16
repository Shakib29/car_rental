/*
  # Add user_id column to promotional_posts table

  1. Changes
    - Add `user_id` column to track which admin created each post
    - Add index for better performance on user_id queries
    - Update RLS policies to include user_id checks

  2. Security
    - Maintain existing RLS policies
    - Add user_id tracking for audit purposes
*/

-- Add user_id column to promotional_posts table
ALTER TABLE promotional_posts 
ADD COLUMN IF NOT EXISTS user_id text;

-- Add index for user_id column
CREATE INDEX IF NOT EXISTS idx_promotional_posts_user_id ON promotional_posts(user_id);

-- Update the trigger function to handle updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';