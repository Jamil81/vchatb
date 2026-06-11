# Local Dev Setup (Windows 11)

## Prerequisites

- NVIDIA RTX 3050, 8GB VRAM (CUDA 8.6)
- Windows 11 Pro
- Git, Node.js 20+, Python 3.11+

## Install Order

### 1. CUDA + cuDNN

Check if already installed:
```
nvidia-smi
```
If CUDA version shows, skip. Otherwise install CUDA 12 + cuDNN 9 from NVIDIA.

### 2. Ollama

```
winget install Ollama.Ollama
```
Auto-detects CUDA on Windows. Then pull the LLM:
```
ollama pull llama3.1:8b
```
Verify: `ollama run llama3.1:8b "hello"`

### 3. Python Backend Dependencies

```
pip install fastapi uvicorn faster-whisper sqlalchemy websockets python-dotenv
```

### 4. Piper TTS (local voice)

Download the latest zip from `github.com/rhasspy/piper/releases`.
Extract to `backend/piper/`. No other dependencies needed.

Download a voice model (en-US example):
```
# Place .onnx and .onnx.json in backend/piper/voices/
```
Arabic voice: download `ar_JO-kareem-medium.onnx` from Piper's HuggingFace releases.

### 5. Next.js Frontend

```
cd frontend
npm install
```

## Configuration

Copy `.env.example` to `.env`:

```env
LOCAL_MODE=true

# Ollama
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=llama3.1:8b

# faster-whisper
WHISPER_MODEL=medium
WHISPER_DEVICE=cuda

# Piper TTS
PIPER_PATH=./piper/piper.exe
PIPER_VOICE_EN=./piper/voices/en_US-amy-medium.onnx
PIPER_VOICE_AR=./piper/voices/ar_JO-kareem-medium.onnx

# Production (set LOCAL_MODE=false to activate)
ANTHROPIC_API_KEY=
DEEPGRAM_API_KEY=
CARTESIA_API_KEY=
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=
DATABASE_URL=sqlite:///./vchatb.db
```

## Start

```bash
# Terminal 1 — Ollama (if not running as service)
ollama serve

# Terminal 2 — Backend (from project root)
.\venv\Scripts\uvicorn.exe backend.main:app --port 8000

# Terminal 3 — Frontend
cd frontend
npm run dev
```

Or with Docker:
```bash
docker compose up
```
Note: Ollama runs on host (GPU passthrough in Windows Docker is unreliable). Backend hits `host.docker.internal:11434`.

## Faster-Whisper Model Guide

| Model | VRAM | Latency | Use When |
|---|---|---|---|
| tiny | <1GB | ~100ms | Fast iteration, testing |
| small | ~1GB | ~500ms | CPU fallback |
| medium | ~2GB | ~300ms | GPU dev (recommended) |
| large-v3-turbo | ~3GB | ~300ms | Best local quality |
