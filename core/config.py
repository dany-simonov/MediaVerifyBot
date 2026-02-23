"""Application settings loaded from environment / .env file."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Telegram
    bot_token: str
    webhook_url: str = ""

    # FastAPI internal
    api_base_url: str = "http://api:8000"
    api_secret_key: str = "change_me"

    # Database
    database_url: str = "postgresql+asyncpg://user:password@db:5432/mediaverifybot"

    # External APIs
    sightengine_api_user: str = ""
    sightengine_api_secret: str = ""
    sapling_api_key: str = ""
    resemble_api_key: str = ""
    hf_api_token: str = ""

    # Rate limits
    free_daily_limit: int = 3
    premium_monthly_limit: int = 100

    # FFmpeg / video
    max_video_duration_seconds: int = 60
    video_frame_sample_rate: int = 1

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
