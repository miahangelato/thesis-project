#!/bin/bash
set -e

echo "🚀 Running startup tasks..."

# Download models
echo "📦 Downloading ML models..."
python download_models.py

# Run migrations
echo "🗄️  Running database migrations..."
python manage.py migrate --noinput

# Collect static files (already done in Dockerfile, but ensure it's up to date)
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Startup tasks complete!"

# Start gunicorn
echo "🌐 Starting gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2
