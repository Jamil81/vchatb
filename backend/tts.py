import asyncio
import logging
import os
import struct
import subprocess
import tempfile
import time

from .config import settings

logger = logging.getLogger(__name__)


def _wav_header(pcm_bytes: bytes, sample_rate: int = 22050, channels: int = 1, bit_depth: int = 16) -> bytes:
    data_size = len(pcm_bytes)
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        data_size + 36,
        b"WAVE",
        b"fmt ",
        16,
        1,  # PCM
        channels,
        sample_rate,
        sample_rate * channels * (bit_depth // 8),
        channels * (bit_depth // 8),
        bit_depth,
        b"data",
        data_size,
    )
    return header + pcm_bytes


async def synthesize(text: str) -> tuple[bytes, float]:
    """Returns (wav_bytes, ttfb_ms)."""
    start = time.perf_counter()

    if settings.local_mode:
        audio = await _synthesize_piper(text)
    else:
        audio = await _synthesize_cartesia(text)

    ttfb_ms = (time.perf_counter() - start) * 1000
    return audio, ttfb_ms


async def _synthesize_piper(text: str) -> bytes:
    loop = asyncio.get_event_loop()

    def _run() -> bytes:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            tmp = f.name
        try:
            proc = subprocess.run(
                [
                    settings.piper_path,
                    "--model",
                    settings.piper_voice_en,
                    "--output-file",
                    tmp,
                ],
                input=text.encode(),
                capture_output=True,
            )
            if proc.returncode != 0:
                logger.error(f"Piper failed: {proc.stderr.decode()}")
                return b""
            with open(tmp, "rb") as f:
                return f.read()
        finally:
            if os.path.exists(tmp):
                os.unlink(tmp)

    return await loop.run_in_executor(None, _run)


async def _synthesize_cartesia(text: str) -> bytes:
    import httpx

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://api.cartesia.ai/tts/bytes",
            headers={
                "X-API-Key": settings.cartesia_api_key,
                "Cartesia-Version": "2024-06-10",
            },
            json={
                "transcript": text,
                "model_id": "sonic-2",
                "voice": {
                    "mode": "id",
                    "id": "a0e99841-438c-4a64-b679-ae501e7d6091",
                },
                "output_format": {
                    "container": "raw",
                    "encoding": "pcm_s16le",
                    "sample_rate": 22050,
                },
            },
        )
        resp.raise_for_status()
        return _wav_header(resp.content)
