import asyncio
import logging
import os
import tempfile
import time

from .config import settings

logger = logging.getLogger(__name__)

_whisper_model = None


def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel

        device = settings.whisper_device
        compute = "float16" if device == "cuda" else "int8"
        if device == "cuda":
            try:
                import torch

                if not torch.cuda.is_available():
                    device = "cpu"
                    compute = "int8"
            except ImportError:
                device = "cpu"
                compute = "int8"

        logger.info(f"Loading Whisper {settings.whisper_model} on {device}")
        _whisper_model = WhisperModel(
            settings.whisper_model, device=device, compute_type=compute
        )
    return _whisper_model


async def transcribe(audio_bytes: bytes) -> tuple[str, float]:
    """Returns (transcript, latency_ms)."""
    start = time.perf_counter()

    if settings.local_mode:
        text = await _transcribe_whisper(audio_bytes)
    else:
        text = await _transcribe_deepgram(audio_bytes)

    latency_ms = (time.perf_counter() - start) * 1000
    return text, latency_ms


async def _transcribe_whisper(audio_bytes: bytes) -> str:
    model = _get_whisper_model()
    loop = asyncio.get_event_loop()

    def _run() -> str:
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
            f.write(audio_bytes)
            tmp = f.name
        try:
            segments, _ = model.transcribe(tmp, vad_filter=True)
            return " ".join(s.text.strip() for s in segments).strip()
        finally:
            os.unlink(tmp)

    return await loop.run_in_executor(None, _run)


async def _transcribe_deepgram(audio_bytes: bytes) -> str:
    from deepgram import DeepgramClient, PrerecordedOptions

    client = DeepgramClient(settings.deepgram_api_key)
    options = PrerecordedOptions(
        model="nova-3",
        language="multi",
        smart_format=True,
    )

    response = await asyncio.to_thread(
        client.listen.prerecorded.v("1").transcribe_file,
        {"buffer": audio_bytes, "mimetype": "audio/webm"},
        options,
    )
    return response.results.channels[0].alternatives[0].transcript
