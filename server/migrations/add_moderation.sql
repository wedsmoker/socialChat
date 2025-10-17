-- Add moderation features to database

-- Add is_admin and is_banned columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_by INTEGER REFERENCES users(id);

-- Create reports table for flagged content
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(20) NOT NULL, -- 'post', 'message', 'user'
    content_id INTEGER, -- post_id or message_id
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for reports
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Add soft delete to posts (for moderation)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_by_mod BOOLEAN DEFAULT FALSE;

-- Add soft delete to messages (for moderation)
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS deleted_by_mod BOOLEAN DEFAULT FALSE;
