# Stack Decisions

## STT (Speech-to-Text)

| Service | Streaming | First Partial | WER | Price/min | Arabic | Notes |
|---|---|---|---|---|---|---|
| **Deepgram Nova-3** | WebSocket | ~300ms | ~9.3% | $0.0077 | Excellent (ar-LB dialect) | **Production pick** |
| Gladia Solaria-1 | WebSocket | ~103ms | N/A | $0.0092 | Good (code-switching) | Worth A/B vs Deepgram |
| AssemblyAI Universal-3 | WebSocket | ~150ms | ~11.1% | $0.0075 | Unconfirmed streaming | Skip |
| OpenAI Realtime | WebSocket | Varies | ~8-12% | $0.017 | Good (MSA only) | No Lebanese dialect |
| faster-whisper | Manual chunks | 143ms-5s | ~8-12% | Free | Good | **Local dev pick** |
| Azure Speech | WebSocket | 1-2s | Unknown | $0.0167 | Good | Too slow |
| AWS Transcribe | HTTP/2 | 30-40s Arabic | Unknown | $0.024 | Poor | Arabic latency bug, skip |

**Why Deepgram:** Sub-300ms first partial, native WebSocket, ar-LB dialect (17 Arabic variants — not just MSA), $200 free credits. Lebanese dialect support is the differentiator; most services do MSA only.

**Why also test Gladia:** 103ms first partial, native Arabic/English code-switching. Lebanese speakers mix languages constantly. Worth an A/B on real samples.

---

## LLM

| Model | VRAM | Use Case |
|---|---|---|
| Phi-3 Mini 3.8B | ~2.5GB | Fast, light reasoning |
| Mistral 7B | ~4.5GB | Strong instruction-following |
| **Llama 3.1 8B** | ~5.5GB | Best quality locally |
| Qwen2.5 7B | ~5GB | Best multilingual locally |

**Local:** Llama 3.1 8B via Ollama (8GB VRAM on RTX 3050 — fits cleanly).
**Production:** Claude Haiku 3.5 — $0.06/day at 200 req. Swapped via env var, zero app changes.

---

## TTS (Text-to-Speech)

| Service | TTFB | Quality | Arabic | Cost/1K chars |
|---|---|---|---|---|
| **Cartesia Sonic 3.5** | ~40ms | 4.7/5 | Good | ~$0.015 |
| **Azure Neural TTS** | ~150-300ms | 4.3/5 | Excellent | $0.015 |
| ElevenLabs Flash v2.5 | ~75ms | 4.8/5 | Fair | $0.015 |
| Piper TTS | <50ms | 3.5/5 | Fair | Free |
| Kokoro 82M | <100ms GPU | 4.0/5 | None | Free |
| Google Chirp 3 HD | ~200ms | 4.3/5 | Excellent | $0.030 |

**English → Cartesia Sonic 3.5.** 40ms TTFB is imperceptible. #1 on Artificial Analysis Realtime TTS Arena (mid-2026). SSM architecture, not transformer-based — handles Arabic reasonably.

**Arabic → Azure Neural TTS.** March 2026 update dropped word-level pronunciation errors 78%. Supports Arabic-English code-switching. Route by detected language.

**Local dev → Piper TTS.** Zip-and-run, <50ms on CPU, no GPU required. Kokoro if GPU available.

---

## Why WebSocket over HTTP

HTTP adds a new TCP handshake per request. At 250ms audio chunks that's measurable overhead. WebSocket stays open for the session duration — audio flows both ways continuously.

---

## Why FastAPI over Node/Express

- Python ecosystem for ML is first-class (faster-whisper, torch, transformers all native)
- Async WebSocket handlers match the streaming pattern
- SQLAlchemy handles SQLite locally and Postgres in prod transparently
- FastAPI auto-generates OpenAPI docs — useful when debugging the pipeline
