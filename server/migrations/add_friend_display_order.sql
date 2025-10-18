-- Add friend display order for MySpace-style top friends
-- Run this migration to add the display_order column to friendships table

ALTER TABLE friendships ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_friendships_display_order ON friendships(display_order);

-- Update existing friendships to have default order (by creation date)
UPDATE friendships
SET display_order = id
WHERE display_order = 0 AND status = 'accepted';
