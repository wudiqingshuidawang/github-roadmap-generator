import hashlib
import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.redis import get_redis
from app.models.roadmap import Project, Roadmap
from app.schemas.roadmap import (
    LLMOutput,
    RoadmapDetail,
    RoadmapGenerateRequest,
    RoadmapGenerateResponse,
)
from app.services.cache import CacheService
from app.services.github import GitHubService
from app.services.llm import LLMService

logger = logging.getLogger(__name__)
router = APIRouter()


def _cache_key(description: str) -> str:
    """Hash description to a fixed-length cache key."""
    return f"roadmap:{hashlib.sha256(description.strip().lower().encode()).hexdigest()[:16]}"


async def _search_github(description: str) -> tuple[list[dict], str]:
    """Search GitHub for similar projects and build context string."""
    github = GitHubService(token=settings.github_token, proxy=settings.github_proxy)
    github_refs: list[dict] = []
    github_context = ""
    try:
        projects = await github.search_projects(description, limit=5)
        github_refs = projects
        if projects:
            analyses = []
            for p in projects[:3]:
                analysis = await github.analyze_project(p["full_name"])
                if analysis.get("readme_excerpt"):
                    analyses.append(f"- {analysis['full_name']}: {analysis['readme_excerpt'][:500]}")
            github_context = "\n".join(analyses)
    except Exception:
        logger.warning("GitHub API request failed, continuing without context", exc_info=True)
    return github_refs, github_context


async def _generate_llm(description: str, github_context: str) -> tuple[LLMOutput, dict]:
    """Generate roadmap via LLM and validate the output."""
    llm = LLMService(
        api_key=settings.anthropic_api_key,
        model=settings.anthropic_model,
        base_url=settings.anthropic_base_url,
    )
    try:
        result = await llm.generate_roadmap(description, github_context)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM service error: {str(e)}")

    if not result:
        raise HTTPException(status_code=502, detail="Failed to generate roadmap")

    try:
        llm_output = LLMOutput.model_validate(result["data"])
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM output validation failed: {e}")

    return llm_output, result


async def _save_roadmap(
    db: AsyncSession,
    description: str,
    github_refs: list[dict],
    llm_output: LLMOutput,
    result: dict,
) -> tuple[Project, Roadmap, str]:
    """Save project and roadmap to database with unique share token."""
    try:
        project = Project(title=description[:255], description=description)
        db.add(project)
        await db.flush()

        share_token = secrets.token_urlsafe(16)[:32]
        for _ in range(10):
            exists = await db.execute(
                select(Roadmap.id).where(Roadmap.share_token == share_token)
            )
            if not exists.scalar_one_or_none():
                break
            share_token = secrets.token_urlsafe(16)[:32]
        roadmap = Roadmap(
            project_id=project.id,
            share_token=share_token,
            github_refs=github_refs,
            tech_stack=llm_output.model_dump()["tech_stack"],
            phases=llm_output.model_dump()["phases"],
            llm_model=result["model"],
            llm_tokens_used=result["tokens_used"],
        )
        db.add(roadmap)
        await db.commit()
        await db.refresh(roadmap)
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save roadmap")

    return project, roadmap, share_token


@router.post("/generate", response_model=RoadmapGenerateResponse)
async def generate_roadmap(
    request: RoadmapGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    redis_client = await get_redis()
    cache = CacheService(redis_client)
    cache_key = _cache_key(request.description)
    cached = await cache.get(cache_key)
    if cached:
        return RoadmapGenerateResponse(
            id=cached["id"], share_token=cached["share_token"]
        )

    github_refs, github_context = await _search_github(request.description)
    llm_output, result = await _generate_llm(request.description, github_context)
    _, roadmap, share_token = await _save_roadmap(
        db, request.description, github_refs, llm_output, result
    )

    await cache.set(cache_key, {
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
