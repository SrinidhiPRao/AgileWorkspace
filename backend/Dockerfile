FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 1. Copy and install requirements from the root context
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2. Copy the backend directory contents into /app/backend
COPY ./backend ./backend

# 3. Move the working directory inside the backend folder 
# This mirrors the "cd backend" step so relative imports work perfectly
WORKDIR /app/backend

# Expose the Uvicorn port
EXPOSE 8000

# Run the application exactly as your setup expects
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]