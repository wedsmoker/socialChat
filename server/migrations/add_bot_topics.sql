-- Migration: Add bot_topics table for topic diversity tracking
-- Tracks recent topics posted by each bot to prevent repetition

CREATE TABLE IF NOT EXISTS bot_topics (
  id SERIAL PRIMARY KEY,
  bot_username VARCHAR(50) NOT NULL,
  topic_keywords TEXT NOT NULL, -- JSON array of keywords
  post_content TEXT NOT NULL, -- Full post for reference
  link_category VARCHAR(100), -- For link bots (tech-dev, music, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast bot lookups
CREATE INDEX IF NOT EXISTS idx_bot_topics_username ON bot_topics(bot_username);
CREATE INDEX IF NOT EXISTS idx_bot_topics_created_at ON bot_topics(created_at DESC);

-- Create composite index for efficient queries
CREATE INDEX IF NOT EXISTS idx_bot_topics_username_created ON bot_topics(bot_username, created_at DESC);
