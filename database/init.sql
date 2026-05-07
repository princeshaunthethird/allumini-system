-- Alumni Network System — PostgreSQL Database Init Script
-- Run this manually OR let SQLAlchemy create tables automatically on first startup.

-- Create database (run as superuser)
CREATE DATABASE alumni_network;
\c alumni_network;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SQLAlchemy will auto-create all tables from models.
-- This file is for reference / manual bootstrap.

-- Seed admin user (optional - password: admin123)
-- INSERT INTO users (name, email, hashed_password, graduation_year, course, is_active)
-- VALUES ('Admin User', 'admin@alumni.com', '$2b$12$...', 2020, 'Computer Science', true);
