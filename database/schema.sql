

-- ============================================================
-- NoBroker Dashboard - PostgreSQL Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  phone         VARCHAR(15),
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REFRESH TOKENS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUTH TOKENS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  token_type VARCHAR(20) NOT NULL DEFAULT 'refresh' CHECK (token_type IN ('access', 'refresh')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO tokens (id, user_id, token, token_type, expires_at)
SELECT id, user_id, token, 'refresh', expires_at
FROM refresh_tokens
ON CONFLICT (token) DO NOTHING;

-- ============================================================
-- USER PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  bio         TEXT,
  address     TEXT,
  city        VARCHAR(100),
  state       VARCHAR(100),
  pincode     VARCHAR(10),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROPERTIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS properties (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  listing_type     VARCHAR(10) NOT NULL CHECK (listing_type IN ('rent', 'buy')),
  property_type    VARCHAR(20) NOT NULL CHECK (property_type IN ('full_home', 'pg', 'hostel', 'apartment', 'villa')),
  bhk              INTEGER CHECK (bhk BETWEEN 1 AND 10),
  price            NUMERIC(12,2) NOT NULL,
  price_negotiable BOOLEAN DEFAULT FALSE,
  location         VARCHAR(200) NOT NULL,
  city             VARCHAR(100),
  state            VARCHAR(100),
  pincode          VARCHAR(10),
  area_sqft        NUMERIC(10,2),
  furnishing       VARCHAR(20) DEFAULT 'unfurnished' CHECK (furnishing IN ('unfurnished','semi_furnished','fully_furnished')),
  floor            INTEGER,
  total_floors     INTEGER,
  parking          BOOLEAN DEFAULT FALSE,
  amenities        TEXT[],
  available_from   DATE,
  is_available     BOOLEAN NOT NULL DEFAULT TRUE,
  images           TEXT[],
  contact_name     VARCHAR(100),
  contact_phone    VARCHAR(15),
  contact_email    VARCHAR(255),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HOME SERVICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS home_services (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  category         VARCHAR(50) NOT NULL CHECK (category IN ('electrical','plumbing','painting','carpentry','cleaning','pest_control','appliance_repair','gardening','security','moving','other')),
  price_type       VARCHAR(20) DEFAULT 'fixed' CHECK (price_type IN ('fixed','hourly','negotiable')),
  price            NUMERIC(10,2),
  location         VARCHAR(200) NOT NULL,
  city             VARCHAR(100),
  state            VARCHAR(100),
  experience_years INTEGER DEFAULT 0,
  is_available     BOOLEAN NOT NULL DEFAULT TRUE,
  rating           NUMERIC(3,1) DEFAULT 0,
  total_reviews    INTEGER DEFAULT 0,
  images           TEXT[],
  provider_name    VARCHAR(100) NOT NULL,
  provider_phone   VARCHAR(15) NOT NULL,
  provider_email   VARCHAR(255),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMPATIBILITY MIGRATION FOR EXISTING LOCAL DATABASES
-- ============================================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS website VARCHAR(255);

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_subject VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_subject ON users(google_subject)
  WHERE google_subject IS NOT NULL;

ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_negotiable BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS furnishing VARCHAR(20) DEFAULT 'unfurnished';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_floors INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS amenities TEXT[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
ALTER TABLE properties ADD CONSTRAINT properties_property_type_check
  CHECK (property_type IN ('full_home', 'pg', 'hostel', 'apartment', 'villa'));

ALTER TABLE home_services ADD COLUMN IF NOT EXISTS price_type VARCHAR(20) DEFAULT 'fixed';
ALTER TABLE home_services ADD COLUMN IF NOT EXISTS location VARCHAR(200);
ALTER TABLE home_services ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE home_services ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE home_services ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;
ALTER TABLE home_services ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) DEFAULT 0;
ALTER TABLE home_services ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE home_services ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE home_services ADD COLUMN IF NOT EXISTS provider_phone VARCHAR(15);
ALTER TABLE home_services ADD COLUMN IF NOT EXISTS provider_email VARCHAR(255);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'home_services' AND column_name = 'phone') THEN
    ALTER TABLE home_services ALTER COLUMN phone DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'home_services' AND column_name = 'service_area') THEN
    ALTER TABLE home_services ALTER COLUMN service_area DROP NOT NULL;
  END IF;
END $$;


-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email            ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role             ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active        ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token   ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_tokens_user_id         ON tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_token           ON tokens(token);
CREATE INDEX IF NOT EXISTS idx_tokens_expires         ON tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_properties_user_id      ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_city         ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_is_available ON properties(is_available);
CREATE INDEX IF NOT EXISTS idx_properties_price        ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_filters      ON properties(listing_type, property_type, is_available);

CREATE INDEX IF NOT EXISTS idx_home_services_user_id   ON home_services(user_id);
CREATE INDEX IF NOT EXISTS idx_home_services_category  ON home_services(category);
CREATE INDEX IF NOT EXISTS idx_home_services_city      ON home_services(city);
CREATE INDEX IF NOT EXISTS idx_home_services_filters   ON home_services(category, is_available);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS properties_updated_at ON properties;
CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS home_services_updated_at ON home_services;
CREATE TRIGGER home_services_updated_at
  BEFORE UPDATE ON home_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- CLEANUP: Remove expired refresh tokens (run periodically)
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM refresh_tokens WHERE expires_at < NOW();
  DELETE FROM tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED DATA
-- ============================================================
-- Admin user: email=admin@nobroker.com, password=Admin@123
-- bcrypt hash for 'Admin@123' with 10 rounds
INSERT INTO users (id, full_name, email, phone, password_hash, role, is_active)
VALUES (
  uuid_generate_v4(),
  'Super Admin',
  'admin@nobroker.com',
  '9876543210',
  '$2a$10$bzBfbzP8DzMietsjqL5mPejk2jQT2ejqzy8EPskMcGKImcSO5plG2',
  'admin',
  TRUE
) ON CONFLICT (email) DO NOTHING;

-- Sample regular users
INSERT INTO users (full_name, email, phone, password_hash, role, is_active)
VALUES
  ('Rahul Sharma',  'rahul@example.com',  '9876543211', '$2a$10$bzBfbzP8DzMietsjqL5mPejk2jQT2ejqzy8EPskMcGKImcSO5plG2', 'user', TRUE),
  ('Priya Patel',   'priya@example.com',  '9876543212', '$2a$10$bzBfbzP8DzMietsjqL5mPejk2jQT2ejqzy8EPskMcGKImcSO5plG2', 'user', TRUE),
  ('Amit Kumar',    'amit@example.com',   '9876543213', '$2a$10$bzBfbzP8DzMietsjqL5mPejk2jQT2ejqzy8EPskMcGKImcSO5plG2', 'user', TRUE),
  ('Sneha Reddy',   'sneha@example.com',  '9876543214', '$2a$10$bzBfbzP8DzMietsjqL5mPejk2jQT2ejqzy8EPskMcGKImcSO5plG2', 'user', TRUE),
  ('Vikram Singh',  'vikram@example.com', '9876543215', '$2a$10$bzBfbzP8DzMietsjqL5mPejk2jQT2ejqzy8EPskMcGKImcSO5plG2', 'admin', TRUE),
  ('Divya Nair',   'divya@example.com',   '9876543216', '$2a$10$bzBfbzP8DzMietsjqL5mPejk2jQT2ejqzy8EPskMcGKImcSO5plG2', 'user', FALSE)
ON CONFLICT (email) DO NOTHING;
