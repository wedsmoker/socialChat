-- Add bot support to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE;

-- Create index for bot queries
CREATE INDEX IF NOT EXISTS idx_users_is_bot ON users(is_bot);
