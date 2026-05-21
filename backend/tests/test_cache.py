import json

import fakeredis.aioredis
import pytest
import pytest_asyncio

from app.services.cache import CacheService


@pytest_asyncio.fixture
async def cache_service():
    fake_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    service = CacheService(redis_client=fake_redis, ttl=3600)
    yield service
    await fake_redis.aclose()


@pytest.mark.asyncio
async def test_cache_set_and_get(cache_service: CacheService):
    data = {"test": "value"}
    await cache_service.set("user input", data)
    result = await cache_service.get("user input")
    assert result == data


@pytest.mark.asyncio
async def test_cache_miss(cache_service: CacheService):
    result = await cache_service.get("nonexistent")
    assert result is None


@pytest.mark.asyncio
async def test_cache_key_hashing(cache_service: CacheService):
    data = {"test": "value"}
    await cache_service.set("input A", data)
    result = await cache_service.get("input A")
    assert result == data
    result = await cache_service.get("input B")
    assert result is None
