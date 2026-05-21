# ProjectPath Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an AI-powered project learning roadmap generator that uses GitHub real data + LLM to produce interactive learning paths.

**Architecture:** FastAPI backend handles GitHub API integration and LLM calls, returning structured JSON. React frontend renders dual-view roadmaps (timeline + mind map) with D3.js visualization.

**Tech Stack:** Python 3.11+, FastAPI, PostgreSQL, Redis, React 18, TypeScript, Tailwind CSS, shadcn/ui, D3.js, OpenAI API

---

## File Structure

```
projectpath/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app entry
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── roadmap.py             # Roadmap API endpoints
│   │   │   └── health.py              # Health check
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py              # Settings/env vars
│   │   │   ├── database.py            # PostgreSQL connection
│   │   │   └── redis.py               # Redis connection
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── roadmap.py             # SQLAlchemy models
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── roadmap.py             # Pydantic schemas
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── github.py              # GitHub API client
│   │       ├── llm.py                 # LLM API client
│   │       └── cache.py               # Cache service
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py                # Test fixtures
│   │   ├── test_github.py
│   │   ├── test_llm.py
│   │   ├── test_cache.py
│   │   └── test_api.py
│   ├── alembic/                       # DB migrations
│   │   ├── env.py
│   │   └── versions/
│   ├── alembic.ini
│   ├── requirements.txt
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api/
│   │   │   └── roadmap.ts             # API client
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn components
│   │   │   ├── TimelineView.tsx       # Timeline visualization
│   │   │   ├── MindMapView.tsx        # Mind map visualization
│   │   │   ├── ViewSwitcher.tsx        # View toggle
│   │   │   ├── ProjectInput.tsx        # Input form
│   │   │   └── LoadingScreen.tsx       # Generating page
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── GeneratingPage.tsx
│   │   │   └── RoadmapPage.tsx
│   │   ├── types/
│   │   │   └── roadmap.ts             # TypeScript types
│   │   └── utils/
│   │       └── share.ts               # Share link utils
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── index.html
├── docker-compose.yml
└── README.md
```

---

## Task 1: Backend Scaffolding & Database Setup

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/database.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/roadmap.py`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `docker-compose.yml`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`

- [ ] **Step 1: Create pyproject.toml**

```toml
[project]
name = "projectpath"
version = "0.1.0"
description = "AI-powered project learning roadmap generator"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.110.0",
    "uvicorn[standard]>=0.27.0",
    "sqlalchemy>=2.0.25",
    "asyncpg>=0.29.0",
    "alembic>=1.13.0",
    "redis>=5.0.0",
    "httpx>=0.26.0",
    "openai>=1.10.0",
    "pydantic>=2.5.0",
    "pydantic-settings>=2.1.0",
    "python-dotenv>=1.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.23.0",
    "httpx>=0.26.0",
    "fakeredis>=2.20.0",
]
```

- [ ] **Step 2: Create requirements.txt**

```
fastapi>=0.110.0
uvicorn[standard]>=0.27.0
sqlalchemy>=2.0.25
asyncpg>=0.29.0
alembic>=1.13.0
redis>=5.0.0
httpx>=0.26.0
openai>=1.10.0
pydantic>=2.5.0
pydantic-settings>=2.1.0
python-dotenv>=1.0.0
pytest>=7.4.0
pytest-asyncio>=0.23.0
fakeredis>=2.20.0
```

- [ ] **Step 3: Create config.py**

```python
# backend/app/core/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/projectpath"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # GitHub
    github_token: str = ""

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4"

    # App
    app_name: str = "ProjectPath"
    cache_ttl: int = 604800  # 7 days in seconds

    model_config = {"env_file": ".env"}


settings = Settings()
```

- [ ] **Step 4: Create database.py**

```python
# backend/app/core/database.py
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session
```

- [ ] **Step 5: Create SQLAlchemy models**

```python
# backend/app/models/roadmap.py
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    roadmaps: Mapped[list["Roadmap"]] = relationship(back_populates="project")


class Roadmap(Base):
    __tablename__ = "roadmaps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id"))
    share_token: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    github_refs: Mapped[dict] = mapped_column(JSONB, nullable=True)
    tech_stack: Mapped[dict] = mapped_column(JSONB, nullable=True)
    phases: Mapped[dict] = mapped_column(JSONB, nullable=True)
    llm_model: Mapped[str] = mapped_column(String(50), nullable=True)
    llm_tokens_used: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    project: Mapped["Project"] = relationship(back_populates="roadmaps")
```

- [ ] **Step 6: Create models/__init__.py**

```python
# backend/app/models/__init__.py
from app.models.roadmap import Project, Roadmap

__all__ = ["Project", "Roadmap"]
```

- [ ] **Step 7: Create docker-compose.yml**

```yaml
# docker-compose.yml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: projectpath
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

- [ ] **Step 8: Create FastAPI main.py**

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, roadmap
from app.core.config import settings

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(roadmap.router, prefix="/api/roadmap", tags=["roadmap"])
```

- [ ] **Step 9: Create health endpoint**

```python
# backend/app/api/health.py
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "ok"}
```

- [ ] **Step 10: Create test fixtures**

```python
# backend/tests/conftest.py
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
```

- [ ] **Step 11: Start services and verify**

```bash
docker compose up -d
cd backend && pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Expected: Server starts on http://localhost:8000

- [ ] **Step 12: Commit**

```bash
git add backend/ docker-compose.yml
git commit -m "feat: backend scaffolding with FastAPI, PostgreSQL, Redis"
```

---

## Task 2: Database Migrations

**Files:**
- Create: `backend/alembic/env.py`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/versions/001_initial.py`

- [ ] **Step 1: Initialize Alembic**

```bash
cd backend && alembic init alembic
```

- [ ] **Step 2: Configure alembic.ini**

Edit `backend/alembic.ini`, set:
```ini
sqlalchemy.url = postgresql+asyncpg://postgres:postgres@localhost:5432/projectpath
```

- [ ] **Step 3: Configure alembic/env.py for async**

Replace `backend/alembic/env.py` with:

```python
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.models.roadmap import Base

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    connectable = create_async_engine(settings.database_url)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online():
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 4: Generate initial migration**

```bash
cd backend && alembic revision --autogenerate -m "initial tables"
```

- [ ] **Step 5: Run migration**

```bash
cd backend && alembic upgrade head
```

Expected: Tables `projects` and `roadmaps` created.

- [ ] **Step 6: Commit**

```bash
git add backend/alembic.ini backend/alembic/
git commit -m "feat: add Alembic database migrations"
```

---

## Task 3: Pydantic Schemas

**Files:**
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/schemas/roadmap.py`

- [ ] **Step 1: Create Pydantic schemas**

```python
# backend/app/schemas/roadmap.py
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class Resource(BaseModel):
    type: str = Field(description="github, doc, video, article")
    title: str
    url: str


class Task(BaseModel):
    title: str
    description: str
    resources: list[Resource] = []
    difficulty: str = Field(description="beginner, intermediate, advanced")
    dependencies: list[str] = []


class Phase(BaseModel):
    name: str
    duration: str
    tasks: list[Task]


class TechStackItem(BaseModel):
    name: str
    reason: str


class GitHubRef(BaseModel):
    name: str
    full_name: str
    url: str
    stars: int
    description: str | None = None


class RoadmapGenerateRequest(BaseModel):
    description: str = Field(min_length=5, max_length=1000, description="Project description")


class RoadmapGenerateResponse(BaseModel):
    id: uuid.UUID
    share_token: str


class RoadmapDetail(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    share_token: str
    github_refs: list[GitHubRef] | None = None
    tech_stack: list[TechStackItem] | None = None
    phases: list[Phase] | None = None
    llm_model: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/schemas/
git commit -m "feat: add Pydantic schemas for roadmap API"
```

---

## Task 4: GitHub API Service

**Files:**
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/github.py`
- Create: `backend/tests/test_github.py`

- [ ] **Step 1: Write test for GitHub service**

```python
# backend/tests/test_github.py
import pytest

from app.services.github import GitHubService


@pytest.fixture
def github_service():
    return GitHubService(token="")


def test_extract_keywords():
    service = GitHubService(token="")
    keywords = service._extract_keywords("我想做一个电商网站，支持购物车和支付")
    assert "电商" in keywords or "购物" in keywords


def test_build_search_query():
    service = GitHubService(token="")
    query = service._build_search_query("React 电商网站")
    assert "react" in query.lower() or "ecommerce" in query.lower()
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pytest tests/test_github.py -v
```

Expected: FAIL with "ModuleNotFoundError: No module named 'app.services.github'"

- [ ] **Step 3: Implement GitHub service**

```python
# backend/app/services/github.py
import re

import httpx

from app.core.config import settings


class GitHubService:
    BASE_URL = "https://api.github.com"

    def __init__(self, token: str = ""):
        self.token = token or settings.github_token
        self.headers = {"Accept": "application/vnd.github.v3+json"}
        if self.token:
            self.headers["Authorization"] = f"token {self.token}"

    async def search_projects(self, description: str, limit: int = 5) -> list[dict]:
        query = self._build_search_query(description)
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/search/repositories",
                params={"q": query, "sort": "stars", "per_page": limit},
                headers=self.headers,
                timeout=10.0,
            )
            resp.raise_for_status()
            data = resp.json()
            return [
                {
                    "name": item["name"],
                    "full_name": item["full_name"],
                    "url": item["html_url"],
                    "stars": item["stargazers_count"],
                    "description": item.get("description", ""),
                }
                for item in data.get("items", [])
            ]

    async def get_file_content(self, owner: str, repo: str, path: str) -> str | None:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}/contents/{path}",
                headers=self.headers,
                timeout=10.0,
            )
            if resp.status_code == 200:
                import base64
                content = resp.json().get("content", "")
                return base64.b64decode(content).decode("utf-8", errors="ignore")
            return None

    async def get_readme(self, owner: str, repo: str) -> str | None:
        return await self.get_file_content(owner, repo, "README.md")

    async def analyze_project(self, full_name: str) -> dict:
        owner, repo = full_name.split("/")
        result = {"full_name": full_name, "tech_stack": [], "readme_excerpt": ""}

        # Try common dependency files
        for dep_file in ["package.json", "requirements.txt", "go.mod", "Cargo.toml"]:
            content = await self.get_file_content(owner, repo, dep_file)
            if content:
                result["tech_stack"].append({"file": dep_file, "content": content[:2000]})
                break

        readme = await self.get_readme(owner, repo)
        if readme:
            result["readme_excerpt"] = readme[:1500]

        return result

    def _extract_keywords(self, description: str) -> list[str]:
        # Simple keyword extraction: remove common words, keep meaningful ones
        stop_words = {"我", "想", "做", "一个", "的", "和", "是", "在", "有", "了", "就", "不"}
        words = re.findall(r"[\w一-鿿]+", description)
        return [w for w in words if w not in stop_words and len(w) > 1]

    def _build_search_query(self, description: str) -> str:
        keywords = self._extract_keywords(description)
        # Map Chinese keywords to English for better GitHub search
        keyword_map = {
            "电商": "ecommerce",
            "购物": "shopping",
            "社交": "social media",
            "聊天": "chat",
            "博客": "blog",
            "论坛": "forum",
            "游戏": "game",
            "音乐": "music",
            "视频": "video streaming",
            "地图": "map",
            "天气": "weather",
            "新闻": "news",
            "教育": "education",
            "学习": "learning",
            "管理": "management system",
            "平台": "platform",
            "系统": "system",
            "网站": "website",
            "应用": "app",
        }
        english_keywords = []
        for kw in keywords:
            if kw in keyword_map:
                english_keywords.append(keyword_map[kw])
            elif kw.isascii():
                english_keywords.append(kw)
        return " ".join(english_keywords[:5]) if english_keywords else " ".join(keywords[:5])
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && pytest tests/test_github.py -v
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/github.py backend/tests/test_github.py
git commit -m "feat: add GitHub API service with project search and analysis"
```

---

## Task 5: LLM Service

**Files:**
- Create: `backend/app/services/llm.py`
- Create: `backend/tests/test_llm.py`

- [ ] **Step 1: Write test for LLM output parsing**

```python
# backend/tests/test_llm.py
import json

import pytest

from app.services.llm import LLMService


def test_parse_roadmap_json():
    service = LLMService(api_key="test", model="gpt-4")
    sample_json = json.dumps({
        "tech_stack": [{"name": "React", "reason": "Frontend framework"}],
        "phases": [
            {
                "name": "Phase 1",
                "duration": "1 week",
                "tasks": [
                    {
                        "title": "Setup",
                        "description": "Initialize project",
                        "resources": [],
                        "difficulty": "beginner",
                        "dependencies": [],
                    }
                ],
            }
        ],
    })
    result = service._parse_response(sample_json)
    assert result is not None
    assert len(result["phases"]) == 1
    assert result["phases"][0]["name"] == "Phase 1"


def test_parse_invalid_json():
    service = LLMService(api_key="test", model="gpt-4")
    result = service._parse_response("not valid json")
    assert result is None


def test_extract_json_from_markdown():
    service = LLMService(api_key="test", model="gpt-4")
    markdown = 'Here is the roadmap:\n```json\n{"tech_stack": [], "phases": []}\n```'
    result = service._parse_response(markdown)
    assert result is not None
    assert "phases" in result
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && pytest tests/test_llm.py -v
```

Expected: FAIL with "ModuleNotFoundError: No module named 'app.services.llm'"

- [ ] **Step 3: Implement LLM service**

```python
# backend/app/services/llm.py
import json
import re

from openai import AsyncOpenAI

from app.core.config import settings

SYSTEM_PROMPT = """你是一个项目规划专家。根据用户想做的项目和 GitHub 上真实项目的数据，生成一份详细的学习路线图。

输出必须是严格的 JSON 格式（不要包含 markdown 代码块标记），包含以下字段：
- tech_stack: 推荐技术栈列表，每项包含 name（技术名称）和 reason（推荐理由）
- phases: 学习阶段列表

每个阶段包含：
- name: 阶段名称
- duration: 预估学习时间
- tasks: 任务列表

每个任务包含：
- title: 任务标题
- description: 详细描述（50-200字）
- resources: 学习资源列表，每项包含 type（github/doc/video/article）、title、url
- difficulty: beginner/intermediate/advanced
- dependencies: 依赖的前置任务标题列表（没有则为空数组）

请确保：
1. 每个阶段有 2-5 个任务
2. 共 3-5 个阶段
3. 学习资源的 URL 必须是真实存在的（优先使用提供的 GitHub 项目链接）
4. 任务描述要具体，不要泛泛而谈
"""


class LLMService:
    def __init__(self, api_key: str = "", model: str = ""):
        self.api_key = api_key or settings.openai_api_key
        self.model = model or settings.openai_model
        self.client = AsyncOpenAI(api_key=self.api_key)

    async def generate_roadmap(
        self, description: str, github_context: str = ""
    ) -> dict | None:
        user_prompt = f"用户想做的项目：{description}"
        if github_context:
            user_prompt += f"\n\n以下是 GitHub 上类似的热门项目及其技术栈：\n{github_context}"
        user_prompt += "\n\n请基于以上数据，生成学习路线图。"

        for attempt in range(3):
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.7,
                    max_tokens=4000,
                )
                content = response.choices[0].message.content
                result = self._parse_response(content)
                if result:
                    return {
                        "data": result,
                        "model": self.model,
                        "tokens_used": response.usage.total_tokens if response.usage else 0,
                    }
            except Exception:
                if attempt == 2:
                    raise
        return None

    def _parse_response(self, content: str) -> dict | None:
        # Try direct JSON parse
        try:
            data = json.loads(content)
            if "phases" in data:
                return data
        except json.JSONDecodeError:
            pass

        # Try extracting JSON from markdown code block
        match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", content, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(1))
                if "phases" in data:
                    return data
            except json.JSONDecodeError:
                pass

        return None
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && pytest tests/test_llm.py -v
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/llm.py backend/tests/test_llm.py
git commit -m "feat: add LLM service with OpenAI integration and JSON parsing"
```

---

## Task 6: Cache Service

**Files:**
- Create: `backend/app/core/redis.py`
- Create: `backend/app/services/cache.py`
- Create: `backend/tests/test_cache.py`

- [ ] **Step 1: Create Redis connection**

```python
# backend/app/core/redis.py
import redis.asyncio as redis

from app.core.config import settings

redis_client = redis.from_url(settings.redis_url, decode_responses=True)


async def get_redis() -> redis.Redis:
    return redis_client
```

- [ ] **Step 2: Write test for cache service**

```python
# backend/tests/test_cache.py
import json

import fakeredis.aioredis
import pytest

from app.services.cache import CacheService


@pytest.fixture
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
    # Same input should hit cache
    result = await cache_service.get("input A")
    assert result == data
    # Different input should miss
    result = await cache_service.get("input B")
    assert result is None
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd backend && pytest tests/test_cache.py -v
```

Expected: FAIL with "ModuleNotFoundError"

- [ ] **Step 4: Implement cache service**

```python
# backend/app/services/cache.py
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
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd backend && pytest tests/test_cache.py -v
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/core/redis.py backend/app/services/cache.py backend/tests/test_cache.py
git commit -m "feat: add Redis cache service with SHA256 key hashing"
```

---

## Task 7: Roadmap API Endpoints

**Files:**
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/roadmap.py`
- Create: `backend/tests/test_api.py`

- [ ] **Step 1: Write test for generate endpoint**

```python
# backend/tests/test_api.py
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && pytest tests/test_api.py -v
```

Expected: Health test passes, others fail

- [ ] **Step 3: Implement roadmap API**

```python
# backend/app/api/__init__.py
```

```python
# backend/app/api/roadmap.py
import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import get_redis
from app.models.roadmap import Project, Roadmap
from app.schemas.roadmap import (
    RoadmapDetail,
    RoadmapGenerateRequest,
    RoadmapGenerateResponse,
)
from app.services.cache import CacheService
from app.services.github import GitHubService
from app.services.llm import LLMService

router = APIRouter()


@router.post("/generate", response_model=RoadmapGenerateResponse)
async def generate_roadmap(
    request: RoadmapGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    # Check cache first
    redis_client = await get_redis()
    cache = CacheService(redis_client)
    cached = await cache.get(request.description)
    if cached:
        return RoadmapGenerateResponse(
            id=cached["id"], share_token=cached["share_token"]
        )

    # Search GitHub for similar projects
    github = GitHubService()
    github_refs = []
    github_context = ""
    try:
        projects = await github.search_projects(request.description, limit=3)
        github_refs = projects
        analyses = []
        for proj in projects[:2]:
            analysis = await github.analyze_project(proj["full_name"])
            analyses.append(analysis)
        github_context = "\n".join(
            f"- {a['full_name']}: {', '.join(s['file'] for s in a['tech_stack'])}"
            for a in analyses
        )
    except Exception:
        pass  # GitHub API failure is non-fatal

    # Generate roadmap with LLM
    llm = LLMService()
    try:
        result = await llm.generate_roadmap(request.description, github_context)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM service error: {str(e)}")

    if not result:
        raise HTTPException(status_code=502, detail="Failed to generate roadmap")

    # Save to database
    project = Project(title=request.description[:255], description=request.description)
    db.add(project)
    await db.flush()

    share_token = secrets.token_urlsafe(16)[:32]
    roadmap = Roadmap(
        project_id=project.id,
        share_token=share_token,
        github_refs=github_refs,
        tech_stack=result["data"].get("tech_stack"),
        phases=result["data"].get("phases"),
        llm_model=result["model"],
        llm_tokens_used=result["tokens_used"],
    )
    db.add(roadmap)
    await db.commit()
    await db.refresh(roadmap)

    # Cache the result
    await cache.set(request.description, {
        "id": str(roadmap.id),
        "share_token": share_token,
    })

    return RoadmapGenerateResponse(id=roadmap.id, share_token=share_token)


@router.get("/{share_token}", response_model=RoadmapDetail)
async def get_roadmap(
    share_token: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Roadmap).where(Roadmap.share_token == share_token)
    )
    roadmap = result.scalar_one_or_none()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")

    await db.refresh(roadmap, ["project"])

    return RoadmapDetail(
        id=roadmap.id,
        title=roadmap.project.title,
        description=roadmap.project.description,
        share_token=roadmap.share_token,
        github_refs=roadmap.github_refs,
        tech_stack=roadmap.tech_stack,
        phases=roadmap.phases,
        llm_model=roadmap.llm_model,
        created_at=roadmap.created_at,
    )
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && pytest tests/test_api.py -v
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/roadmap.py backend/tests/test_api.py
git commit -m "feat: add roadmap API endpoints with GitHub + LLM integration"
```

---

## Task 8: Frontend Scaffolding

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/index.css`

- [ ] **Step 1: Initialize React project with Vite**

```bash
cd /Users/yan/Documents/Project/app3 && npm create vite@latest frontend -- --template react-ts
cd frontend && npm install
```

- [ ] **Step 2: Install dependencies**

```bash
cd frontend && npm install tailwindcss @tailwindcss/vite d3 zustand react-router-dom
npm install -D @types/d3
```

- [ ] **Step 3: Configure Tailwind**

```typescript
// frontend/vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});
```

```css
/* frontend/src/index.css */
@import "tailwindcss";
```

- [ ] **Step 4: Create main entry**

```typescript
// frontend/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 5: Create App with routing**

```typescript
// frontend/src/App.tsx
import { BrowserRouter, Route, Routes } from "react-router-dom";
import GeneratingPage from "./pages/GeneratingPage";
import HomePage from "./pages/HomePage";
import RoadmapPage from "./pages/RoadmapPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/generating" element={<GeneratingPage />} />
        <Route path="/roadmap/:shareToken" element={<RoadmapPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 6: Create placeholder pages**

```typescript
// frontend/src/pages/HomePage.tsx
export default function HomePage() {
  return <div className="min-h-screen bg-gray-50">Home</div>;
}
```

```typescript
// frontend/src/pages/GeneratingPage.tsx
export default function GeneratingPage() {
  return <div className="min-h-screen bg-gray-50">Generating...</div>;
}
```

```typescript
// frontend/src/pages/RoadmapPage.tsx
export default function RoadmapPage() {
  return <div className="min-h-screen bg-gray-50">Roadmap</div>;
}
```

- [ ] **Step 7: Start dev server and verify**

```bash
cd frontend && npm run dev
```

Expected: App runs on http://localhost:5173

- [ ] **Step 8: Commit**

```bash
git add frontend/
git commit -m "feat: frontend scaffolding with React, Vite, Tailwind, routing"
```

---

## Task 9: TypeScript Types & API Client

**Files:**
- Create: `frontend/src/types/roadmap.ts`
- Create: `frontend/src/api/roadmap.ts`

- [ ] **Step 1: Create TypeScript types**

```typescript
// frontend/src/types/roadmap.ts
export interface Resource {
  type: string;
  title: string;
  url: string;
}

export interface RoadmapTask {
  title: string;
  description: string;
  resources: Resource[];
  difficulty: string;
  dependencies: string[];
}

export interface Phase {
  name: string;
  duration: string;
  tasks: RoadmapTask[];
}

export interface TechStackItem {
  name: string;
  reason: string;
}

export interface GitHubRef {
  name: string;
  full_name: string;
  url: string;
  stars: number;
  description: string | null;
}

export interface RoadmapData {
  id: string;
  title: string;
  description: string;
  share_token: string;
  github_refs: GitHubRef[] | null;
  tech_stack: TechStackItem[] | null;
  phases: Phase[] | null;
  llm_model: string | null;
  created_at: string;
}

export interface GenerateResponse {
  id: string;
  share_token: string;
}
```

- [ ] **Step 2: Create API client**

```typescript
// frontend/src/api/roadmap.ts
import type { GenerateResponse, RoadmapData } from "../types/roadmap";

const API_BASE = "/api/roadmap";

export async function generateRoadmap(description: string): Promise<GenerateResponse> {
  const resp = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  if (!resp.ok) {
    const error = await resp.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || "Failed to generate roadmap");
  }
  return resp.json();
}

export async function getRoadmap(shareToken: string): Promise<RoadmapData> {
  const resp = await fetch(`${API_BASE}/${shareToken}`);
  if (!resp.ok) {
    if (resp.status === 404) throw new Error("Roadmap not found");
    throw new Error("Failed to fetch roadmap");
  }
  return resp.json();
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/ frontend/src/api/
git commit -m "feat: add TypeScript types and API client for roadmap"
```

---

## Task 10: Home Page with Input

**Files:**
- Create: `frontend/src/components/ProjectInput.tsx`
- Modify: `frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: Implement ProjectInput component**

```typescript
// frontend/src/components/ProjectInput.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateRoadmap } from "../api/roadmap";

export default function ProjectInput() {
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 5) {
      setError("Please describe your project in at least 5 characters");
      return;
    }
    navigate("/generating", { state: { description } });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your project idea... e.g., 'I want to build an e-commerce website with shopping cart and payment'"
          className="w-full h-40 p-4 text-lg border-2 border-gray-200 rounded-xl resize-none focus:border-blue-500 focus:outline-none transition-colors"
        />
      </div>
      {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={description.trim().length < 5}
        className="mt-4 px-8 py-3 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        Generate Roadmap
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Implement HomePage**

```typescript
// frontend/src/pages/HomePage.tsx
import ProjectInput from "../components/ProjectInput";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Project<span className="text-blue-600">Path</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-lg mx-auto">
          Describe your project idea, and AI will generate a step-by-step learning roadmap based on real GitHub projects.
        </p>
      </div>
      <ProjectInput />
      <div className="mt-16 grid grid-cols-3 gap-8 text-center max-w-3xl">
        <div>
          <div className="text-2xl font-bold text-blue-600">GitHub</div>
          <p className="text-sm text-gray-500 mt-1">Real project data</p>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600">AI</div>
          <p className="text-sm text-gray-500 mt-1">Smart roadmap generation</p>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600">2 Views</div>
          <p className="text-sm text-gray-500 mt-1">Timeline + Mind map</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

```bash
cd frontend && npm run dev
```

Expected: Home page renders with input form

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ProjectInput.tsx frontend/src/pages/HomePage.tsx
git commit -m "feat: implement home page with project input form"
```

---

## Task 11: Roadmap Page with Timeline View

**Files:**
- Create: `frontend/src/components/TimelineView.tsx`
- Modify: `frontend/src/pages/RoadmapPage.tsx`

- [ ] **Step 1: Implement TimelineView component**

```typescript
// frontend/src/components/TimelineView.tsx
import type { Phase, RoadmapTask } from "../types/roadmap";

interface Props {
  phases: Phase[];
}

function TaskCard({ task }: { task: RoadmapTask }) {
  const difficultyColor: Record<string, string> = {
    beginner: "bg-green-100 text-green-800",
    intermediate: "bg-yellow-100 text-yellow-800",
    advanced: "bg-red-100 text-red-800",
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-gray-900">{task.title}</h4>
        <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor[task.difficulty] || "bg-gray-100"}`}>
          {task.difficulty}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-2">{task.description}</p>
      {task.resources.length > 0 && (
        <div className="mt-3 space-y-1">
          {task.resources.map((r, i) => (
            <a
              key={i}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <span className="opacity-60">[{r.type}]</span> {r.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TimelineView({ phases }: Props) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-200" />

      <div className="space-y-8">
        {phases.map((phase, i) => (
          <div key={i} className="relative pl-16">
            {/* Phase dot */}
            <div className="absolute left-4 w-5 h-5 bg-blue-600 rounded-full border-4 border-white shadow" />

            {/* Phase header */}
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">{phase.name}</h3>
              <span className="text-sm text-gray-500">{phase.duration}</span>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              {phase.tasks.map((task, j) => (
                <TaskCard key={j} task={task} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement RoadmapPage**

```typescript
// frontend/src/pages/RoadmapPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRoadmap } from "../api/roadmap";
import TimelineView from "../components/TimelineView";
import type { RoadmapData } from "../types/roadmap";

export default function RoadmapPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shareToken) return;
    getRoadmap(shareToken)
      .then(setRoadmap)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-lg">{error || "Roadmap not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{roadmap.title}</h1>
          <p className="text-gray-600">{roadmap.description}</p>
          {roadmap.tech_stack && (
            <div className="flex flex-wrap gap-2 mt-4">
              {roadmap.tech_stack.map((tech, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  title={tech.reason}
                >
                  {tech.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* View toggle placeholder - will be added in Task 13 */}
        <div className="mb-6 flex justify-end">
          <button className="px-4 py-2 text-sm bg-white border rounded-lg">
            Timeline View
          </button>
        </div>

        {/* Roadmap content */}
        {roadmap.phases && <TimelineView phases={roadmap.phases} />}

        {/* Share link */}
        <div className="mt-12 p-4 bg-white rounded-lg border text-center">
          <p className="text-sm text-gray-500 mb-2">Share this roadmap:</p>
          <code className="text-blue-600 break-all">
            {window.location.origin}/roadmap/{roadmap.share_token}
          </code>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

```bash
cd frontend && npm run dev
```

Expected: Roadmap page renders timeline view

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/TimelineView.tsx frontend/src/pages/RoadmapPage.tsx
git commit -m "feat: implement roadmap page with timeline view"
```

---

## Task 12: Mind Map View with D3.js

**Files:**
- Create: `frontend/src/components/MindMapView.tsx`

- [ ] **Step 1: Implement MindMapView component**

```typescript
// frontend/src/components/MindMapView.tsx
import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { Phase } from "../types/roadmap";

interface Props {
  phases: Phase[];
  title: string;
}

interface MindMapNode {
  name: string;
  children?: MindMapNode[];
  description?: string;
  difficulty?: string;
}

function buildTree(phases: Phase[], title: string): MindMapNode {
  return {
    name: title,
    children: phases.map((phase) => ({
      name: phase.name,
      children: phase.tasks.map((task) => ({
        name: task.title,
        description: task.description,
        difficulty: task.difficulty,
      })),
    })),
  };
}

export default function MindMapView({ phases, title }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 900;
    const height = 600;
    const margin = { top: 20, right: 120, bottom: 20, left: 120 };

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const treeData = buildTree(phases, title);
    const root = d3.hierarchy(treeData);

    const treeLayout = d3.tree<MindMapNode>().size([
      height - margin.top - margin.bottom,
      width - margin.left - margin.right,
    ]);

    treeLayout(root);

    // Links
    g.selectAll(".link")
      .data(root.links())
      .join("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 1.5)
      .attr(
        "d",
        d3.linkHorizontal()
          .x((d: any) => d.y)
          .y((d: any) => d.x)
      );

    // Nodes
    const node = g
      .selectAll(".node")
      .data(root.descendants())
      .join("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

    node
      .append("circle")
      .attr("r", (d) => (d.depth === 0 ? 8 : d.depth === 1 ? 6 : 4))
      .attr("fill", (d) =>
        d.depth === 0 ? "#2563eb" : d.depth === 1 ? "#3b82f6" : "#93c5fd"
      )
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    node
      .append("text")
      .attr("dy", "0.35em")
      .attr("x", (d: any) => (d.children ? -12 : 12))
      .attr("text-anchor", (d: any) => (d.children ? "end" : "start"))
      .text((d) => d.data.name)
      .attr("font-size", (d) => (d.depth === 0 ? "14px" : d.depth === 1 ? "12px" : "11px"))
      .attr("font-weight", (d) => (d.depth <= 1 ? "bold" : "normal"))
      .attr("fill", "#1e293b");
  }, [phases, title]);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border overflow-x-auto">
      <svg ref={svgRef} className="w-full" style={{ minHeight: "500px" }} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/MindMapView.tsx
git commit -m "feat: implement mind map view with D3.js"
```

---

## Task 13: View Switcher

**Files:**
- Create: `frontend/src/components/ViewSwitcher.tsx`
- Modify: `frontend/src/pages/RoadmapPage.tsx`

- [ ] **Step 1: Implement ViewSwitcher component**

```typescript
// frontend/src/components/ViewSwitcher.tsx
interface Props {
  view: "timeline" | "mindmap";
  onViewChange: (view: "timeline" | "mindmap") => void;
}

export default function ViewSwitcher({ view, onViewChange }: Props) {
  return (
    <div className="inline-flex rounded-lg border bg-white p-1">
      <button
        onClick={() => onViewChange("timeline")}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          view === "timeline"
            ? "bg-blue-600 text-white"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        Timeline
      </button>
      <button
        onClick={() => onViewChange("mindmap")}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          view === "mindmap"
            ? "bg-blue-600 text-white"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        Mind Map
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Update RoadmapPage with view switching**

Replace the view toggle placeholder in `frontend/src/pages/RoadmapPage.tsx`:

```typescript
// Add import at top:
import { useState } from "react";
import MindMapView from "../components/MindMapView";
import ViewSwitcher from "../components/ViewSwitcher";

// Add state inside component:
const [view, setView] = useState<"timeline" | "mindmap">("timeline");

// Replace the placeholder view toggle div with:
<div className="mb-6 flex justify-end">
  <ViewSwitcher view={view} onViewChange={setView} />
</div>

// Replace the roadmap content section with:
{roadmap.phases && (
  view === "timeline" ? (
    <TimelineView phases={roadmap.phases} />
  ) : (
    <MindMapView phases={roadmap.phases} title={roadmap.title} />
  )
)}
```

- [ ] **Step 3: Verify in browser**

```bash
cd frontend && npm run dev
```

Expected: Can switch between timeline and mind map views

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ViewSwitcher.tsx frontend/src/pages/RoadmapPage.tsx
git commit -m "feat: add view switcher between timeline and mind map"
```

---

## Task 14: Loading Screen & Error Handling

**Files:**
- Create: `frontend/src/components/LoadingScreen.tsx`
- Modify: `frontend/src/pages/GeneratingPage.tsx`
- Modify: `frontend/src/pages/RoadmapPage.tsx`

- [ ] **Step 1: Implement LoadingScreen component**

```typescript
// frontend/src/components/LoadingScreen.tsx
export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-4">
      <div className="relative mb-8">
        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Generating your roadmap</h2>
      <p className="text-gray-600 text-center max-w-md">
        Searching GitHub for similar projects and building your personalized learning path...
      </p>
      <div className="mt-8 flex gap-2">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update GeneratingPage**

```typescript
// frontend/src/pages/GeneratingPage.tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { generateRoadmap } from "../api/roadmap";
import LoadingScreen from "../components/LoadingScreen";

export default function GeneratingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const description = (location.state as { description?: string })?.description;

  useEffect(() => {
    if (!description) {
      navigate("/");
      return;
    }
    generateRoadmap(description)
      .then((result) => navigate(`/roadmap/${result.share_token}`))
      .catch(() => navigate("/"));
  }, [description, navigate]);

  return <LoadingScreen />;
}
```

- [ ] **Step 3: Add error boundary to RoadmapPage**

Update `frontend/src/pages/RoadmapPage.tsx` to show a retry button on error:

```typescript
// Replace the error section with:
if (error || !roadmap) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 text-lg mb-4">{error || "Roadmap not found"}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/LoadingScreen.tsx frontend/src/pages/GeneratingPage.tsx frontend/src/pages/RoadmapPage.tsx
git commit -m "feat: add loading screen and error handling UI"
```

---

## Task 15: Share & Copy Link

**Files:**
- Create: `frontend/src/utils/share.ts`
- Modify: `frontend/src/pages/RoadmapPage.tsx`

- [ ] **Step 1: Create share utility**

```typescript
// frontend/src/utils/share.ts
export async function copyShareLink(shareToken: string): Promise<boolean> {
  const url = `${window.location.origin}/roadmap/${shareToken}`;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    return true;
  }
}
```

- [ ] **Step 2: Add copy button to RoadmapPage**

Update the share section in `frontend/src/pages/RoadmapPage.tsx`:

```typescript
// Add import:
import { copyShareLink } from "../utils/share";
import { useState } from "react";

// Add state:
const [copied, setCopied] = useState(false);

// Replace the share link section with:
<div className="mt-12 p-4 bg-white rounded-lg border text-center">
  <p className="text-sm text-gray-500 mb-2">Share this roadmap:</p>
  <div className="flex items-center justify-center gap-2">
    <code className="text-blue-600 break-all">
      {window.location.origin}/roadmap/{roadmap.share_token}
    </code>
    <button
      onClick={async () => {
        await copyShareLink(roadmap.share_token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/utils/share.ts frontend/src/pages/RoadmapPage.tsx
git commit -m "feat: add copy share link functionality"
```

---

## Task 16: Docker Compose & Local Development

**Files:**
- Modify: `docker-compose.yml`
- Create: `backend/.env.example`

- [ ] **Step 1: Create .env.example**

```bash
# backend/.env.example
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/projectpath
REDIS_URL=redis://localhost:6379/0
GITHUB_TOKEN=
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4
```

- [ ] **Step 2: Add backend service to docker-compose.yml**

```yaml
# Add to docker-compose.yml services section:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:postgres@postgres:5432/projectpath
      REDIS_URL: redis://redis:6379/0
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      GITHUB_TOKEN: ${GITHUB_TOKEN}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- [ ] **Step 3: Create backend Dockerfile**

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 4: Verify full stack**

```bash
# Terminal 1: Start backend services
docker compose up postgres redis

# Terminal 2: Start backend
cd backend && cp .env.example .env  # Edit with your API keys
alembic upgrade head
uvicorn app.main:app --reload

# Terminal 3: Start frontend
cd frontend && npm run dev
```

Expected: Full app running at http://localhost:5173

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml backend/Dockerfile backend/.env.example
git commit -m "feat: add Docker setup for local development"
```

---

## Task 17: README & Documentation

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

```markdown
# ProjectPath

AI-powered project learning roadmap generator. Describe your project idea, and get a personalized learning path based on real GitHub projects.

## Features

- **GitHub-Powered**: Analyzes real open-source projects to generate accurate roadmaps
- **AI-Generated**: Uses LLM to create structured, actionable learning plans
- **Dual Views**: Switch between timeline and mind map visualizations
- **Shareable**: Generate share links for your roadmaps

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Python 3.11+
- OpenAI API key

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/projectpath.git
   cd projectpath
   ```

2. Start database services:
   ```bash
   docker compose up postgres redis -d
   ```

3. Set up backend:
   ```bash
   cd backend
   cp .env.example .env  # Add your OpenAI API key
   pip install -e .
   alembic upgrade head
   uvicorn app.main:app --reload
   ```

4. Set up frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. Open http://localhost:5173

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, D3.js
- **Backend**: Python, FastAPI, SQLAlchemy, PostgreSQL, Redis
- **APIs**: GitHub REST API, OpenAI API

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup instructions"
```

---

## Task 18: Integration Test & Polish

**Files:**
- Create: `backend/tests/test_integration.py`

- [ ] **Step 1: Write integration test**

```python
# backend/tests/test_integration.py
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_full_flow(client):
    """Test the complete flow: generate -> retrieve"""
    # This test requires a running backend with DB and API keys
    # Skip in CI unless integration tests are enabled
    import os
    if not os.getenv("RUN_INTEGRATION_TESTS"):
        pytest.skip("Integration tests disabled")

    # Generate a roadmap
    resp = await client.post(
        "/api/roadmap/generate",
        json={"description": "Build a simple todo app with React"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert "share_token" in data

    # Retrieve the roadmap
    resp = await client.get(f"/api/roadmap/{data['share_token']}")
    assert resp.status_code == 200
    roadmap = resp.json()
    assert roadmap["phases"] is not None
    assert len(roadmap["phases"]) > 0
    assert roadmap["tech_stack"] is not None
```

- [ ] **Step 2: Run integration test**

```bash
cd backend && RUN_INTEGRATION_TESTS=1 pytest tests/test_integration.py -v
```

Expected: Full flow passes (requires API keys)

- [ ] **Step 3: Manual QA checklist**

Test in browser:
1. Home page loads with input form
2. Enter a project description, click Generate
3. Loading screen appears
4. Roadmap page shows with timeline view
5. Switch to mind map view
6. Copy share link works
7. Open share link in new tab shows same roadmap

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete ProjectPath MVP"
```
