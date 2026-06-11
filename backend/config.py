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

    # TTS
    cartesia_api_key: str = ""
    piper_executable: str = "piper"
    piper_model: str = "en_US-lessac-medium"

    # DB
    database_url: str = "sqlite:///./chatbot.db"

    class Config:
        env_file = ".env"


settings = Settings()
