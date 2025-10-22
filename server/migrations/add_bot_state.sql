-- Migration: Add bot state table for persistent bot configuration
-- This table stores bot runtime state that needs to persist across server restarts

CREATE TABLE IF NOT EXISTS bot_state (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default bot state
INSERT INTO bot_state (key, value)
VALUES ('last_roasted_username', NULL)
ON CONFLICT (key) DO NOTHING;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_bot_state_key ON bot_state(key);
