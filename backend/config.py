from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent
_ROOT_DIR = _BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    local_mode: bool = True

    # STT
    deepgram_api_key: str = ""
    whisper_model: str = "small"  # tiny|small|medium|large
    whisper_device: str = "cuda"  # cuda|cpu

    # LLM
    ollama_base_url: str = "http://localhost:11434/v1"
    ollama_model: str = "llama3.1:8b"
    anthropic_api_key: str = ""
    claude_model: str = "claude-haiku-4-5-20251001"

    # TTS — local Piper (paths relative to backend/)
    piper_path: str = "./piper/piper.exe"
    piper_voice_en: str = "./piper/voices/en_US-amy-medium.onnx"
    piper_voice_ar: str = "./piper/voices/ar_JO-kareem-medium.onnx"

    # TTS — production Cartesia
    cartesia_api_key: str = ""

    # Profile
    profile: str = "jamlo"

    # DB
    database_url: str = "sqlite:///./vchatb.db"

    @model_validator(mode="after")
    def resolve_backend_paths(self) -> "Settings":
        for name in ("piper_path", "piper_voice_en", "piper_voice_ar"):
            value = getattr(self, name)
            path = Path(value)
            if not path.is_absolute():
                object.__setattr__(self, name, str((_BACKEND_DIR / path).resolve()))
        return self


settings = Settings()
