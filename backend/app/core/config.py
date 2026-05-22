from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = ""
    redis_url: str = "redis://localhost:6379/0"
    github_token: str = ""
    github_proxy: str = ""  # e.g. "http://127.0.0.1:7897"
    anthropic_base_url: str = "https://api.anthropic.com"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-20250514"
    app_name: str = "ProjectPath"
    cache_ttl: int = 604800
    cors_origins: list[str] = ["*"]  # In production, set to your frontend URL

    model_config = {"env_file": ".env"}


settings = Settings()
