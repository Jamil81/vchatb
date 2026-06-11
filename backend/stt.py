import asyncio
import logging
import os
import sys
import tempfile
import time
from pathlib import Path

from .config import settings

logger = logging.getLogger(__name__)

_whisper_model = None


def _register_nvidia_dll_dirs() -> None:
    """Make pip-installed NVIDIA libs (nvidia-cublas-cu12, nvidia-cudnn-cu12)
    visible to ctranslate2 on Windows."""
    if sys.platform != "win32":
        return
    nvidia_root = Path(sys.prefix) / "Lib" / "site-packages" / "nvidia"
    if not nvidia_root.is_dir():
        return
    for bin_dir in nvidia_root.glob("*/bin"):
        os.add_dll_directory(str(bin_dir))


def _cuda_available() -> bool:
    try:
        import ctranslate2

        return ctranslate2.get_cuda_device_count() > 0
    except Exception:
        return False


def _build_model(device: str):
    from faster_whisper import WhisperModel

    compute = "float16" if device == "cuda" else "int8"
    logger.info(f"Loading Whisper {settings.whisper_model} on {device}")
    return WhisperModel(settings.whisper_model, device=device, compute_type=compute)


def _is_gpu_lib_error(e: Exception) -> bool:
    msg = str(e).lower()
    return "dll" in msg or "cublas" in msg or "cudnn" in msg or "cuda" in msg


def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        _register_nvidia_dll_dirs()

        device = settings.whisper_device
        if device == "cuda" and not _cuda_available():
            logger.warning("CUDA requested but not available — falling back to CPU")
            device = "cpu"

        try:
            _whisper_model = _build_model(device)
        except Exception as e:
            if device == "cuda" and _is_gpu_lib_error(e):
                logger.error(
                    f"GPU load failed ({e}) — falling back to CPU. "
                    "Install GPU libs: pip install nvidia-cublas-cu12 nvidia-cudnn-cu12"
                )
                _whisper_model = _build_model("cpu")
            else:
                raise
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

    def _transcribe_file(m, path: str) -> str:
        segments, _ = m.transcribe(path, vad_filter=True)
        return " ".join(s.text.strip() for s in segments).strip()

    def _run() -> str:
        global _whisper_model
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
            f.write(audio_bytes)
            tmp = f.name
        try:
            try:
                return _transcribe_file(model, tmp)
            except RuntimeError as e:
                # GPU libs can be missing even when CUDA is detected — the
                # failure only surfaces at inference time.
                if not _is_gpu_lib_error(e):
                    raise
                logger.error(
                    f"GPU inference failed ({e}) — rebuilding on CPU. "
                    "Install GPU libs: pip install nvidia-cublas-cu12 nvidia-cudnn-cu12"
                )
                _whisper_model = _build_model("cpu")
                return _transcribe_file(_whisper_model, tmp)
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
