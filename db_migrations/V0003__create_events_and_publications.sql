CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    organizer_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    participant_price INTEGER DEFAULT 0,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    max_participants INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS event_publications (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id),
    organizer_id INTEGER NOT NULL REFERENCES users(id),
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_amount INTEGER DEFAULT 100,
    payment_id VARCHAR(255),
    payment_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    UNIQUE(event_id)
);

CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_event_publications_event_id ON event_publications(event_id);
CREATE INDEX idx_event_publications_organizer_id ON event_publications(organizer_id);