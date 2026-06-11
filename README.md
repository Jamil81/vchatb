# vchatb — Voice Chatbot

A real-time voice chatbot with streaming audio in/out, persistent conversation memory, and a live transcript/summary panel.

Runs fully local on Windows 11 with Ollama. One `.env` change swaps to Claude + Deepgram + Cartesia in production.

## Stack

| Layer | Local | Production |
|---|---|---|
| Frontend | Next.js 14 App Router | Vercel |
| Transport | WebSocket (both directions) | Same |
| STT | faster-whisper (CUDA) | Deepgram Nova-3 |
| LLM | Ollama (llama3.1:8b) | Claude Haiku 3.5 |
| TTS (English) | Piper TTS | Cartesia Sonic 3.5 |
| TTS (Arabic) | Piper TTS | Azure Neural TTS |
| Memory | SQLite | Supabase PostgreSQL |
| Backend | FastAPI + Uvicorn | Fly.io |

## Quick Start

```bash
# Clone and configure
cp .env.example .env
# Edit .env — set LOCAL_MODE=true for local dev

# Start everything
docker compose up
```

Frontend: http://localhost:3000
Backend: http://localhost:8000

## Docs

- [Architecture](docs/architecture.md)
- [Local Setup](docs/local-setup.md)
- [API Keys](docs/api-keys.md)
- [Stack Decisions](docs/stack.md)
- [Deployment](docs/deployment.md)
- [Cost Estimate](docs/cost.md)
