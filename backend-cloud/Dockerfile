FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Increase pip timeout for large packages (TensorFlow)
ENV PIP_DEFAULT_TIMEOUT=300

# Upgrade pip first (separate layer for better caching)
RUN pip install --upgrade pip

# Copy requirements and install in stages for better caching
COPY requirements.txt .

# Install heavy ML dependencies first (these change rarely)
RUN pip install --no-cache-dir --timeout=300 --retries=5 \
    tensorflow-cpu==2.15.0 \
    numpy==1.24.3 \
    opencv-python-headless==4.8.1.78 \
    Pillow==11.3.0

# Install remaining dependencies (these change more often)
RUN pip install --no-cache-dir --timeout=300 --retries=5 -r requirements.txt

# Copy application code (this changes most frequently)
COPY . .

# Create staticfiles directory and collect static files
RUN mkdir -p /app/staticfiles && \
    python manage.py collectstatic --noinput

# Expose Django port
EXPOSE 8000

# Start with Gunicorn
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
