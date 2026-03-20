
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'subscriber' CHECK (role IN ('owner', 'admin', 'subscriber')),
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    gdpr_consent BOOLEAN NOT NULL DEFAULT FALSE,
    gdpr_consent_at TIMESTAMPTZ,
    gdpr_consent_ip VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token VARCHAR(512) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE invites (
    id SERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    created_by INTEGER NOT NULL REFERENCES users(id),
    used_by INTEGER REFERENCES users(id),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_invites_code ON invites(code);
CREATE INDEX idx_users_email ON users(email);

INSERT INTO users (nickname, email, password_hash, role, gdpr_consent, gdpr_consent_at, gdpr_consent_ip)
VALUES (
    'owner',
    'owner@tradeclub.ru',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBpj2A8yRoGhNu',
    'owner',
    TRUE,
    NOW(),
    '127.0.0.1'
);
