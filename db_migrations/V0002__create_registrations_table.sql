CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    event_id INTEGER NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_amount INTEGER DEFAULT 100,
    payment_id VARCHAR(255),
    payment_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    UNIQUE(user_id, event_id)
);

CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_payment_status ON registrations(payment_status);