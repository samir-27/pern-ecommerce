-- Migration 007: Complete Application & Database Schema Reconciliation
-- Resolves missing columns: return_requests.resolved_at and products.rejection_reason
-- Synchronizes moderation_note and rejection_reason bidirectionally.

BEGIN;

-- 1. Add missing resolved_at column to return_requests
ALTER TABLE return_requests 
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

-- 2. Add missing rejection_reason column to products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Backfill existing data
UPDATE products 
SET rejection_reason = moderation_note 
WHERE rejection_reason IS NULL AND moderation_note IS NOT NULL;

UPDATE products 
SET moderation_note = rejection_reason 
WHERE moderation_note IS NULL AND rejection_reason IS NOT NULL;

-- 4. Create bidirectional sync function & trigger for products
CREATE OR REPLACE FUNCTION sync_product_moderation_note()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rejection_reason IS NOT NULL AND (NEW.moderation_note IS NULL OR NEW.rejection_reason <> OLD.rejection_reason) THEN
        NEW.moderation_note := NEW.rejection_reason;
    ELSIF NEW.moderation_note IS NOT NULL AND (NEW.rejection_reason IS NULL OR NEW.moderation_note <> OLD.moderation_note) THEN
        NEW.rejection_reason := NEW.moderation_note;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_product_moderation ON products;
CREATE TRIGGER trg_sync_product_moderation
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION sync_product_moderation_note();

-- 5. Performance indexes for return request moderation
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status);
CREATE INDEX IF NOT EXISTS idx_return_requests_resolved_at ON return_requests(resolved_at);

COMMIT;
