#!/bin/bash
# Backend startup script for Render

set -e

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Creating necessary directories..."
mkdir -p "${UPLOAD_DIR:-uploads}" "${RESULTS_DIR:-results}"

echo "Starting FastAPI application..."
# If running on Render (PORT set) use gunicorn with uvicorn worker for production
if [ -n "$PORT" ]; then
	exec gunicorn -k uvicorn.workers.UvicornWorker app:app --bind 0.0.0.0:$PORT --log-level ${LOG_LEVEL:-info}
else
	exec uvicorn app:app --host 0.0.0.0 --port 8000 --reload
fi
