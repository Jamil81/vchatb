import json
import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .llm import chat_stream, summarize
from .memory import get_db, get_history, increment_turn, save_message
from .stt import transcribe
from .tts import synthesize

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    mode = "local (Ollama + Whisper + Piper)" if settings.local_mode else "production (Claude + Deepgram + Cartesia)"
    logger.info(f"Starting in {mode} mode")
    yield


app = FastAPI(title="VChatBot", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "mode": "local" if settings.local_mode else "production",
        "llm": settings.ollama_model if settings.local_mode else settings.claude_model,
    }


@app.websocket("/ws/{session_id}")
async def voice_ws(websocket: WebSocket, session_id: str):
    await websocket.accept()
    db = next(get_db())
    audio_buffer = bytearray()
    logger.info(f"[{session_id[:8]}] connected")

    try:
        while True:
            data = await websocket.receive()

            if data.get("type") == "websocket.disconnect":
                break

            if "bytes" in data:
                audio_buffer.extend(data["bytes"])

            elif "text" in data:
                msg = json.loads(data["text"])
                msg_type = msg.get("type")

                if msg_type == "end_of_speech":
                    if len(audio_buffer) < 1000:
                        audio_buffer.clear()
                        continue

                    t_start = time.perf_counter()
                    audio_bytes = bytes(audio_buffer)
                    audio_buffer.clear()

                    # --- STT ---
                    transcript, stt_ms = await transcribe(audio_bytes)
                    if not transcript:
                        await websocket.send_text(json.dumps({"type": "stt_empty"}))
                        continue

                    logger.info(f"[{session_id[:8]}] STT {stt_ms:.0f}ms: {transcript}")
                    save_message(db, session_id, "user", transcript)

                    await websocket.send_text(json.dumps({
                        "type": "transcript",
                        "text": transcript,
                        "latency_ms": round(stt_ms),
                    }))

                    # --- LLM ---
                    llm_start = time.perf_counter()
                    tokens: list[str] = []
                    ttft_ms = 0.0

                    async for token, ttft in chat_stream(session_id, transcript, db):
                        tokens.append(token)
                        if ttft > 0 and ttft_ms == 0:
                            ttft_ms = ttft
                        await websocket.send_text(json.dumps({"type": "token", "text": token}))

                    llm_ms = (time.perf_counter() - llm_start) * 1000
                    full_response = "".join(tokens)
                    save_message(db, session_id, "assistant", full_response)
                    logger.info(f"[{session_id[:8]}] LLM ttft={ttft_ms:.0f}ms full={llm_ms:.0f}ms")

                    # --- TTS ---
                    audio_out, tts_ms = await synthesize(full_response)
                    logger.info(f"[{session_id[:8]}] TTS {tts_ms:.0f}ms {len(audio_out)} bytes")

                    total_ms = (time.perf_counter() - t_start) * 1000

                    await websocket.send_text(json.dumps({
                        "type": "response_complete",
                        "latency": {
                            "stt_ms": round(stt_ms),
                            "llm_ttft_ms": round(ttft_ms),
                            "tts_ms": round(tts_ms),
                            "total_ms": round(total_ms),
                        },
                    }))

                    if audio_out:
                        await websocket.send_bytes(audio_out)

                    # Summarize every 4 turns
                    turn = increment_turn(db, session_id)
                    if turn % 4 == 0:
                        history = get_history(db, session_id)
                        summary_text = await summarize(history)
                        await websocket.send_text(json.dumps({
                            "type": "summary",
                            "text": summary_text,
                        }))

                elif msg_type == "request_summary":
                    history = get_history(db, session_id)
                    summary_text = await summarize(history)
                    await websocket.send_text(json.dumps({
                        "type": "summary",
                        "text": summary_text,
                    }))

    except WebSocketDisconnect:
        logger.info(f"[{session_id[:8]}] disconnected")
    except Exception as e:
        logger.error(f"[{session_id[:8]}] error: {e}", exc_info=True)
        try:
            await websocket.close(code=1011)
        except Exception:
            pass
    finally:
        db.close()
