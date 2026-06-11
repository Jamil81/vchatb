# Project Workflow — vchatb

**First bot:** Jamlo — recruiter-facing AI avatar that represents Jamil professionally. Visitors on a profile page have a voice conversation with it as if talking to Jamil. Knows his skills, experience, and personality. No personal/private data.

See [persona-jamlo.md](persona-jamlo.md) for full persona spec.

---

## Current Step: 2 — Scaffold project structure

---

## Steps

- [x] 1. Research & design — architecture, stack decisions, STT/TTS/LLM comparisons, cost estimate
- [ ] **2. Scaffold project structure — folders, docker-compose, .env.example, .gitignore**
- [ ] 3. Register APIs — Anthropic, Deepgram, Cartesia, Azure (get keys ready)
- [ ] 4. Build backend: FastAPI app skeleton — main.py, config.py, WebSocket handler stub
- [ ] 5. Build backend: STT module (stt.py) — faster-whisper local, Deepgram prod, env-switched
- [ ] 6. Build backend: LLM module (llm.py) — Ollama local, Claude prod, chat_stream() abstraction
- [ ] 7. Build backend: TTS module (tts.py) — Piper local, Cartesia (EN) + Azure (AR) prod
- [ ] 8. Build backend: memory module (memory.py) — SQLite session persistence, conversation history
- [ ] 9. Wire backend: connect STT → LLM → TTS pipeline in WebSocket handler
- [ ] 10. Test backend locally — Postman/wscat WebSocket test, verify round-trip audio
- [ ] 11. Build frontend: Next.js app skeleton — layout, page structure, env config
- [ ] 12. Build frontend: VoiceRecorder component — MediaRecorder, 250ms chunks, WebSocket send
- [ ] 13. Build frontend: audio playback — AudioContext, receive TTS bytes, play streaming audio
- [ ] 14. Build frontend: Transcript panel — display STT partials in real time
- [ ] 15. Build frontend: Summary panel — rolling 3-bullet summary every 4-6 turns
- [ ] 16. Wire frontend to backend — connect WebSocket, test full local flow
- [ ] 17. End-to-end local test — full voice conversation, verify latency, check Arabic
- [ ] 18. Add latency logging — log STT time, LLM first-token time, TTS TTFB to terminal
- [ ] 19. Docker Compose — containerize backend, wire to host Ollama
- [ ] 20. Switch to production mode — flip LOCAL_MODE=false, test with real APIs
- [ ] 21. Deploy frontend to Vercel
- [ ] 22. Deploy backend to Railway (staging)
- [ ] 23. End-to-end cloud test — full conversation via deployed URLs
- [ ] 24. Migrate backend to Fly.io (production)
- [ ] 25. Migrate DB to Supabase — update DATABASE_URL, verify persistence
- [ ] 26. Performance tuning — reduce latency, optimize chunk size, tune VAD if needed
- [ ] 27. Polish UI — clean transcript display, loading states, error handling
- [ ] 28. Write README — architecture diagram, one-command start, env table, demo instructions
- [ ] 29. Record demo — live voice conversation + latency visible in terminal
- [ ] 30. Publish — push to GitHub, add to portfolio
