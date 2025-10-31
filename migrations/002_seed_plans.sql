-- Seed plans data for subscription feature
-- Run this against the same DATABASE_URL used by the app.

BEGIN;

INSERT INTO plans (id, name, description, price, currency, features, is_active) VALUES
  (1, 'Free', 'Perfect for trying out AI code reviews', 0.00, 'USD', '["Basic code analysis","Up to 5 reviews/month","Community support","Limited AI suggestions"]', true),
  (2, 'Pro', 'Unlock advanced AI features, higher review limits, and priority support.', 29.00, 'USD', '["Advanced code analysis","Unlimited reviews","Priority email support","Intelligent AI suggestions","CI/CD integration","Detailed reporting"]', true),
  (3, 'Enterprise', 'Custom AI models and dedicated support for large teams.', 0.00, 'USD', '["All Pro features","Dedicated account manager","On-premise deployment","Custom AI models","Advanced security features","SLA agreements"]', true)
ON CONFLICT (id) DO NOTHING; -- safe to run multiple times

-- Ensure the serial sequence is set to the max id
SELECT setval(pg_get_serial_sequence('plans','id'), COALESCE((SELECT MAX(id) FROM plans), 1), true);

COMMIT;
