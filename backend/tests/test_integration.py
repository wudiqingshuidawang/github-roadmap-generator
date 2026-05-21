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
async def test_full_flow(client):
    """Test the complete flow: generate -> retrieve"""
    import os
    if not os.getenv("RUN_INTEGRATION_TESTS"):
        pytest.skip("Integration tests disabled")

    resp = await client.post(
        "/api/roadmap/generate",
        json={"description": "Build a simple todo app with React"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert "share_token" in data

    resp = await client.get(f"/api/roadmap/{data['share_token']}")
    assert resp.status_code == 200
    roadmap = resp.json()
    assert roadmap["phases"] is not None
    assert len(roadmap["phases"]) > 0
    assert roadmap["tech_stack"] is not None
