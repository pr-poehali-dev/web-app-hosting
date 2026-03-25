CREATE TABLE chat_settings (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) NOT NULL DEFAULT 'MessageSquare',
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_readonly BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id)
);

INSERT INTO chat_settings (channel_id, label, description, icon, is_enabled, is_readonly, sort_order) VALUES
  ('intraday',    'Интрадей и мысли', 'Текущие торговые идеи автора',   'Lightbulb',     TRUE, TRUE,  1),
  ('chat',        'Общий чат',        'Общение всех подписчиков',        'MessageSquare', TRUE, FALSE, 2),
  ('metals',      'Металлы',          'Идеи и обсуждение металлов',      'Gem',           TRUE, FALSE, 3),
  ('oil',         'Газ / Нефть',      'Идеи по нефти и газу',            'Flame',         TRUE, FALSE, 4),
  ('products',    'Продукты',         'Сельхозтовары и сырьё',           'Wheat',         TRUE, FALSE, 5),
  ('video',       'Видео-обзоры',     'Обзоры рынка от автора',          'Video',         TRUE, TRUE,  6),
  ('tech',        'Техвопросы',       'Технические вопросы',             'Wrench',        TRUE, FALSE, 7),
  ('access_info', 'Доступ',           'Инструкции по доступу и VPN',     'KeyRound',      TRUE, TRUE,  8),
  ('knowledge',   'База знаний',      'Обучающие материалы',             'BookOpen',      TRUE, TRUE,  9);