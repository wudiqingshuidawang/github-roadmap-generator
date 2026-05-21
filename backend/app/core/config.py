from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/projectpath"
    redis_url: str = "redis://localhost:6379/0"
    github_token: str = ""
    openai_api_key: str = ""
    openai_model: str = "gpt-4"
    app_name: str = "ProjectPath"
    cache_ttl: int = 604800

    model_config = {"env_file": ".env"}


settings = Settings()
