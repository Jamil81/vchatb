from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    local_mode: bool = True

    # STT
    deepgram_api_key: str = ""
    whisper_model: str = "small"  # tiny|small|medium|large

    # LLM
    ollama_base_url: str = "http://localhost:11434/v1"
    ollama_model: str = "llama3.1:8b"
    anthropic_api_key: str = ""
    claude_model: str = "claude-haiku-4-5-20251001"

    # TTS — local Piper
    piper_path: str = "./piper/piper.exe"
    piper_voice_en: str = "./piper/voices/en_US-amy-medium.onnx"
    piper_voice_ar: str = "./piper/voices/ar_JO-kareem-medium.onnx"

    # TTS — production Cartesia
    cartesia_api_key: str = ""

    # DB
    database_url: str = "sqlite:///./vchatb.db"

    class Config:
        env_file = ".env"


settings = Settings()
