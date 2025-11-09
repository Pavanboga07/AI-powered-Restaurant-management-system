-- Restaurant Management System - Database Setup Script
-- Run this in PostgreSQL (pgAdmin or psql)

-- Create database
CREATE DATABASE restaurant_db;

-- Connect to the database
\c restaurant_db;

-- Create a dedicated user (optional but recommended)
CREATE USER restaurant_admin WITH PASSWORD 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE restaurant_db TO restaurant_admin;

-- Verify connection
SELECT current_database();

-- The tables will be created automatically by SQLAlchemy when you run the backend
-- You don't need to create them manually

-- After running the backend, you can verify tables were created with:
-- \dt

-- Sample queries to check data (run after using the app):
-- SELECT * FROM users;
-- SELECT * FROM menu_items;
-- SELECT * FROM tables;
-- SELECT * FROM orders;
-- SELECT * FROM reservations;
