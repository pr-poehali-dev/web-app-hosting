UPDATE users SET password_hash = '3768f2025def2a27bca1519f270452fd833b3681b841d2837f48e48b81ccef7d' WHERE email = 'admin@tradeclub.ru';
UPDATE users SET password_hash = '91874019f5985d7c0812cc337046bca8c4dd6e42ebc4e628f7cb45882dde9210' WHERE email = 'sub@tradeclub.ru';

INSERT INTO subscriptions (user_id, plan, status, started_at, expires_at, created_by)
VALUES (4, 'month', 'active', NOW(), NOW() + INTERVAL '30 days', 1);