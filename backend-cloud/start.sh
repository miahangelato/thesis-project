#!/bin/bash
# Railway startup script - runs before gunicorn starts

echo "=== Railway Startup Script ==="

# Download models if needed
echo "Checking for ML models..."
python download_models.py

# Run collectstatic
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start gunicorn
echo "Starting gunicorn..."
exec gunicorn config.wsgi:application --log-file -
