-- Migration 005: Drop unused tables and optimize queries
-- Approved in codebase audit: ai_usage_logs (0 rows, AI unmounted), commission_rules (0 rows, dynamic commission removed in favor of static 5%)

DROP TABLE IF EXISTS ai_usage_logs CASCADE;
DROP TABLE IF EXISTS commission_rules CASCADE;

-- Enforce standard static 5% commission across all stores and brands
UPDATE brands SET commission_rate = 5.00 WHERE commission_rate IS DISTINCT FROM 5.00;
UPDATE seller_stores SET commission_rate = 5.00 WHERE commission_rate IS DISTINCT FROM 5.00;

-- Create index on orders(user_id) for faster buyer order queries
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
