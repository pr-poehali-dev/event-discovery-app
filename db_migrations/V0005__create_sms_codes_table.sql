-- Создаём таблицу для SMS кодов подтверждения
CREATE TABLE IF NOT EXISTS sms_codes (
    phone VARCHAR(20) PRIMARY KEY,
    code VARCHAR(4) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

-- Индекс для быстрого поиска по телефону
CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON sms_codes(phone);