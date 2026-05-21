from app.core.database import get_db
from app.main import app


class MockResult:
    def scalar_one_or_none(self):
        return None


class MockSession:
    async def execute(self, *args, **kwargs):
        return MockResult()

    async def refresh(self, *args, **kwargs):
        pass

    async def commit(self):
        pass

    async def flush(self):
        pass

    def add(self, obj):
        pass


async def override_get_db():
    session = MockSession()
    yield session


app.dependency_overrides[get_db] = override_get_db
