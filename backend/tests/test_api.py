import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_check(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_generate_requires_description(client):
    resp = await client.post("/api/roadmap/generate", json={"description": ""})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_get_roadmap_not_found(client):
    resp = await client.get("/api/roadmap/nonexistent")
    assert resp.status_code == 404
