-- Compatibility enhancements for brand controllers and seller dashboards
BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE seller_orders ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(40) DEFAULT 'pending';
ALTER TABLE seller_orders ADD COLUMN IF NOT EXISTS carrier VARCHAR(100);
ALTER TABLE seller_orders ADD COLUMN IF NOT EXISTS net_payout NUMERIC(10,2) DEFAULT 0;

-- Sync any nulls
UPDATE seller_orders SET fulfillment_status = COALESCE(status, 'pending') WHERE fulfillment_status IS NULL;
UPDATE seller_orders SET net_payout = COALESCE(seller_net_earnings, 0) WHERE net_payout IS NULL;

COMMIT;
