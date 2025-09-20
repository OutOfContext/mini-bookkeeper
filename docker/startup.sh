#!/bin/bash
set -e

echo "🚀 Starting Restaurant Bookkeeping App..."

# Validate required environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is required"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERROR: JWT_SECRET environment variable is required"
    exit 1
fi

echo "✅ Environment variables validated"

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('DB connected'); process.exit(0); }).catch(() => process.exit(1));" > /dev/null 2>&1; then
        echo "✅ Database connection established"
        break
    else
        echo "Attempt $attempt/$max_attempts: Database not ready, waiting 3 seconds..."
        sleep 3
        attempt=$((attempt + 1))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ ERROR: Could not connect to database after $max_attempts attempts"
    exit 1
fi

# Generate Prisma client
echo "🔄 Generating Prisma client..."
cd /app
npx prisma generate

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma db push --accept-data-loss

# Seed default users and basic data if needed
echo "👥 Checking and seeding default data..."
node docker/seed-container.js

echo "✅ Database setup complete"

# Start supervisor to manage all services
echo "🎛️  Starting services with supervisor..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf