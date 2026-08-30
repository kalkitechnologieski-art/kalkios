-- Add payment-related columns to orders if not exists
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_request_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- Ensure invoices table has required columns
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ DEFAULT NOW();

-- Add index on orders.payment_request_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_request_id ON orders(payment_request_id);

-- Ensure projects have estimated_delivery
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimated_delivery DATE;

-- Ensure projects have order_id
ALTER TABLE projects ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE CASCADE;

-- Add client_id to projects if missing (should already exist)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Enable RLS for new columns (existing RLS already covers)
