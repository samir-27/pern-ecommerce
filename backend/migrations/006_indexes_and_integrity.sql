-- Migration 006: Performance Indexes and Payment Integrity Constraints

-- 1. Ensure unique razorpay_payment_id to prevent duplicate payment order creation
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id 
ON orders(razorpay_payment_id) 
WHERE razorpay_payment_id IS NOT NULL;

-- 2. Index foreign keys for orders and order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_variant_id 
ON order_items(variant_id);

-- 3. Index foreign keys for return_requests
CREATE INDEX IF NOT EXISTS idx_return_requests_order_id 
ON return_requests(order_id);

CREATE INDEX IF NOT EXISTS idx_return_requests_order_item_id 
ON return_requests(order_item_id);

-- 4. Index audit logs for faster security queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
ON audit_logs(action);
