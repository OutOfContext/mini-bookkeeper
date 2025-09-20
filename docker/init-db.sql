-- Initialization script for PostgreSQL in Docker
-- This ensures the database and user are set up correctly

-- Grant additional permissions to the user
GRANT ALL PRIVILEGES ON DATABASE restaurant_db TO restaurant_user;

-- Connect to the restaurant_db
\c restaurant_db;

-- Grant schema permissions
GRANT CREATE ON SCHEMA public TO restaurant_user;
GRANT USAGE ON SCHEMA public TO restaurant_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO restaurant_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO restaurant_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO restaurant_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO restaurant_user;