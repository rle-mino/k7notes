-- Create the test database for e2e tests
-- This script runs automatically when PostgreSQL container starts

CREATE DATABASE k7notes_test;

-- Grant all privileges to the postgres user
GRANT ALL PRIVILEGES ON DATABASE k7notes_test TO postgres;
