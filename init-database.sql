#!/usr/bin/env psql -U postgres
-- Bánh Kem Online - Database Setup Script
-- Run with: psql -U postgres -f init-database.sql

-- Create user
CREATE USER banh_kem_user WITH PASSWORD 'banh_kem_password';

-- Create database
CREATE DATABASE banh_kem_db OWNER banh_kem_user;

-- Connect to the new database
\c banh_kem_db banh_kem_user;

-- Initialize schema with proper permissions
GRANT ALL PRIVILEGES ON DATABASE banh_kem_db TO banh_kem_user;
ALTER DATABASE banh_kem_db OWNER TO banh_kem_user;

-- Create schema
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL PRIVILEGES ON SCHEMA public TO banh_kem_user;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Run migrations
\i src/migrations/001-init-schema.sql

-- Optional: Seed sample data
-- \i src/seeds/sample-products.js

\echo "✓ Database setup completed successfully!"
\echo "✓ User: banh_kem_user"
\echo "✓ Database: banh_kem_db"
\echo ""
\echo "Next steps:"
\echo "1. Update backend/.env with database credentials"
\echo "2. Run: npm run seed (in backend directory)"
\echo "3. Start backend: npm run dev"
