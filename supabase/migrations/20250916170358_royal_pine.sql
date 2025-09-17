-- Step 1: Add missing columns to the promotional_posts table

-- Adds a UUID column to link posts to a user from the auth.users table.
-- This is essential for Row-Level Security.
ALTER TABLE promotional_posts
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Adds a timestamp that automatically records when the row was first created.
ALTER TABLE promotional_posts
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Adds a timestamp that will automatically update whenever the row is modified.
ALTER TABLE promotional_posts
ADD COLUMN IF NOT EXISTS updated_at timestamptz;


-- Step 2: Create a trigger to automatically update the 'updated_at' column

-- This function updates the 'updated_at' column to the current time.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

-- This trigger runs the function before any row is updated in the table.
CREATE OR REPLACE TRIGGER update_promotional_posts_updated_at
BEFORE UPDATE ON promotional_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- Step 3: Enable Row-Level Security and create access policies

-- This enables RLS, which is a critical security feature.
ALTER TABLE promotional_posts ENABLE ROW LEVEL SECURITY;

-- This policy allows authenticated users to create a new post.
-- The `WITH CHECK` clause ensures they can only insert a post if the
-- 'user_id' they provide matches their own user ID (`auth.uid()`).
CREATE POLICY "Allow authenticated users to create their own posts"
ON promotional_posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- This policy allows everyone (authenticated or not) to read/view
-- all existing promotional posts.
CREATE POLICY "Allow public read-access to all posts"
ON promotional_posts
FOR SELECT
USING (true);


-- Optional: Create an index for faster lookups on the user_id column.
CREATE INDEX IF NOT EXISTS idx_promotional_posts_user_id ON promotional_posts(user_id);