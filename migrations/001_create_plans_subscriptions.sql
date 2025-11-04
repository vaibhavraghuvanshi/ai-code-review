-- Create plans and subscriptions tables if they do not exist
-- Run this against the same DATABASE_URL used by the app.

BEGIN;

-- Plans
CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  currency VARCHAR(10) DEFAULT 'USD',
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  plan_id INTEGER REFERENCES plans(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  renewal_date TIMESTAMP,
  trial_ends_at TIMESTAMP,
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'paid',
  is_auto_renew BOOLEAN DEFAULT TRUE,
  audit_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

COMMIT;
