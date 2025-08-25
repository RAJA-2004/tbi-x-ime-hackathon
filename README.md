# SoF Event Extractor - Deployment Guide

This repository contains a FastAPI backend and a React frontend.

Render deployment steps (already configured via `render.yaml`):

- Backend (Python web service)
  - Build command: installs requirements
  - Start command: `gunicorn -k uvicorn.workers.UvicornWorker app:app --bind 0.0.0.0:$PORT`
  - Ensure these env vars are set in Render: `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `UPLOAD_DIR` (e.g. `/data/uploads`), `RESULTS_DIR` (e.g. `/data/results`)

- Frontend (Static site)
  - Build command: `npm install && npm run build`
  - `REACT_APP_API_URL` is automatically set from the backend service `RENDER_EXTERNAL_URL` in `render.yaml`.

Local development:

- Backend:
  - Create a virtualenv: `python3 -m venv venv && source venv/bin/activate`
  - Install deps: `pip install -r backend/requirements.txt`
  - Run: `cd backend && python3 -m uvicorn app:app --reload --host 127.0.0.1 --port 8000`

- Frontend:
  - `cd frontend && npm install && npm start` (runs on http://localhost:3000)

Notes:
- The backend reads `UPLOAD_DIR` and `RESULTS_DIR` from environment variables (defaults to `uploads` and `results`).
- For production, configure `UPLOAD_DIR` and `RESULTS_DIR` to use a mounted disk (Render `disk` in `render.yaml` maps to `/data`).

