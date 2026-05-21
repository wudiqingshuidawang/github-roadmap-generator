import hashlib
import json

import redis.asyncio as redis


class CacheService:
    PREFIX = "roadmap:"

    def __init__(self, redis_client: redis.Redis, ttl: int = 604800):
        self.redis = redis_client
        self.ttl = ttl

    def _make_key(self, input_text: str) -> str:
        hash_val = hashlib.sha256(input_text.encode()).hexdigest()
        return f"{self.PREFIX}{hash_val}"

    async def get(self, input_text: str) -> dict | None:
        key = self._make_key(input_text)
        data = await self.redis.get(key)
        if data:
            return json.loads(data)
        return None

    async def set(self, input_text: str, value: dict) -> None:
        key = self._make_key(input_text)
        await self.redis.set(key, json.dumps(value, ensure_ascii=False), ex=self.ttl)
