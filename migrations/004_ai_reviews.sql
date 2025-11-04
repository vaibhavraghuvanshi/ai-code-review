-- Make user_id nullable for anonymous reviews
ALTER TABLE reviews ALTER COLUMN user_id DROP NOT NULL;

-- Add JSON issues and raw AI response
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS issues jsonb;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ai_raw jsonb;

-- Add model/usage/cost metadata
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS model varchar(100);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS temperature numeric;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS tokens integer;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS cost numeric;

-- Add status and completed_at
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status varchar(30) DEFAULT 'pending';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS completed_at timestamptz;
