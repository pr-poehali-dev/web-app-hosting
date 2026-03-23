INSERT INTO invites (code, created_by, expires_at)
VALUES 
  ('test-invite-2026', 1, NOW() + INTERVAL '30 days'),
  ('welcome-trader', 1, NOW() + INTERVAL '30 days');