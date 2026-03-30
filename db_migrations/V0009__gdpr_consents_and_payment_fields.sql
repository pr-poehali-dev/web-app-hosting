ALTER TABLE t_p91355423_web_app_hosting.users
  ADD COLUMN IF NOT EXISTS gdpr_policy_version varchar(10) NOT NULL DEFAULT 'v1.0';

CREATE TABLE IF NOT EXISTS t_p91355423_web_app_hosting.gdpr_consents (
  id          serial PRIMARY KEY,
  user_id     integer NOT NULL REFERENCES t_p91355423_web_app_hosting.users(id),
  email       varchar(255) NOT NULL,
  consented_at timestamp with time zone NOT NULL DEFAULT now(),
  policy_version varchar(10) NOT NULL DEFAULT 'v1.0',
  ip_address  varchar(45) NOT NULL,
  user_agent  text
);

ALTER TABLE t_p91355423_web_app_hosting.payment_requests
  ADD COLUMN IF NOT EXISTS payment_date date NULL,
  ADD COLUMN IF NOT EXISTS confirmed_by integer NULL REFERENCES t_p91355423_web_app_hosting.users(id);
