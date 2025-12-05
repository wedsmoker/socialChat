-- Remove visitor analytics tracking (privacy-first approach)
-- We keep rate limiting in-memory only, no database logging

-- Drop the cleanup function first (depends on table)
DROP FUNCTION IF EXISTS cleanup_old_visitor_logs();

-- Drop indexes
DROP INDEX IF EXISTS idx_visitor_logs_visited_at;
DROP INDEX IF EXISTS idx_visitor_logs_ip_address;

-- Drop the visitor logs table
DROP TABLE IF EXISTS visitor_logs;
