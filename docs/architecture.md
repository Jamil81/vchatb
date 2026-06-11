# Architecture

## Data Flow

```
Browser (Next.js 14)
  └─ MediaRecorder (webm/opus, 250ms chunks)
       └─ WebSocket (ws://)
            └─ FastAPI Backend
                 ├─ STT Layer      → faster-whisper (local) | Deepgram Nova-3 (prod)
                 ├─ LLM Layer      → Ollama (local) | Claude Haiku 3.5 (prod)
                 └─ TTS Layer      → Piper TTS (local) | Cartesia + Azure (prod)
                      └─ WebSocket (audio bytes back)
                           └─ Browser AudioContext (plays audio)
```

## Layers

**Frontend — Next.js 14 App Router**
- MediaRecorder captures mic audio as webm/opus chunks every 250ms
- Sends chunks over WebSocket to backend (no HTTP per-request overhead)
- Receives STT partials and TTS audio bytes over same WebSocket
- AudioContext plays audio bytes as they arrive (streaming)
- SSR for transcript panel and summary panel

**Transport — WebSocket (bidirectional)**
- Audio chunks: client → server
- STT partials: server → client (text)
- TTS audio: server → client (bytes)
- HTTP would add per-request overhead that kills conversational latency

**Backend — FastAPI + Uvicorn**
- Async WebSocket handlers
- Each layer (STT, LLM, TTS) is its own module — swap without touching others
- SQLite via SQLAlchemy for session/conversation persistence locally

**LLM Abstraction — llm.py**
- Everything calls `chat_stream()` — single function, streaming output
- Local: points to `http://localhost:11434/v1` (Ollama OpenAI-compatible endpoint)
- Production: two env vars change, same interface talks to Claude
- App code never knows which backend it's using

**Summary Panel**
- Rolling prompt every 4-6 turns: "Summarize the last N messages in 3 bullets"
- Same LLM endpoint, no extra infrastructure

## Service Ports

| Service | Port |
|---|---|
| Next.js frontend | 3000 |
| FastAPI backend | 8000 |
| Ollama | 11434 |
| faster-whisper wrapper | 8001 |
| Kokoro-FastAPI (optional GPU TTS) | 8880 |

## Folder Structure

```
vchatb/
├── frontend/          # Next.js 14 app
│   ├── app/
│   │   ├── page.tsx   # Main chat UI
│   │   └── layout.tsx
│   └── components/
│       ├── VoiceRecorder.tsx
│       ├── Transcript.tsx
│       └── Summary.tsx
├── backend/           # FastAPI app
│   ├── main.py        # WebSocket handler
│   ├── stt.py         # STT layer (faster-whisper / Deepgram)
│   ├── llm.py         # LLM layer (Ollama / Claude)
│   ├── tts.py         # TTS layer (Piper / Cartesia / Azure)
│   ├── memory.py      # Conversation persistence
│   └── config.py      # Env var loading
├── docs/
├── docker-compose.yml
├── .env.example
└── README.md
```
