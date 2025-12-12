# Diabetes Risk Prediction Kiosk

A Cloud-Hybrid IoT system for non-invasive diabetes risk assessment using dermatoglyphic analysis.

## Architecture

- **Frontend**: Next.js 15 (Deployed to Vercel)
- **Backend**: Django + Django Ninja (Deployed to Render)
- **Edge Node**: FastAPI + OpenVINO (Local Mini PC)
- **Database**: Supabase (PostgreSQL + Storage)
- **AI**: Ollama (Llama 3 - Local)

## Project Structure

```
/backend-cloud    - Cloud-based Django backend
/frontend-web     - Next.js frontend application
/edge-node        - Local FastAPI bridge for hardware
/shared-models    - AI models and sync scripts
```

## Setup

See `IMPLEMENTATION_PHASES.md` for detailed setup instructions.

## Technologies

All technologies used are free tier / open source:
- Render (Free Web Service)
- Vercel (Free Frontend Hosting)
- Supabase (Free DB + Storage)
- Ollama (Local LLM)
- OpenVINO (Intel Optimization)
