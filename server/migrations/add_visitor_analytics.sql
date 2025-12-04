-- Visitor analytics tracking
CREATE TABLE IF NOT EXISTS visitor_logs (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,  -- Supports both IPv4 and IPv6
    path VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    user_agent TEXT,
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_visitor_logs_visited_at ON visitor_logs(visited_at);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_ip_address ON visitor_logs(ip_address);

-- Auto-cleanup: Delete logs older than 30 days (keeps DB lean)
-- This will be run periodically by a scheduled job if needed
CREATE OR REPLACE FUNCTION cleanup_old_visitor_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM visitor_logs WHERE visited_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
