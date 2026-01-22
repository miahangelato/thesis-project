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

# Copy requirements and install Python dependencies
COPY requirements.txt .

# Install dependencies with increased timeout and retries
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --timeout=300 --retries=5 -r requirements.txt

# Copy application code
COPY . .

# Expose Django port
EXPOSE 8000

# Start with Gunicorn
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
