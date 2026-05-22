import hashlib
import secrets

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


def _cache_key(description: str) -> str:
    """Hash description to a fixed-length cache key."""
    return f"roadmap:{hashlib.sha256(description.strip().lower().encode()).hexdigest()[:16]}"


@router.post("/generate", response_model=RoadmapGenerateResponse)
async def generate_roadmap(
    request: RoadmapGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    # Check cache first
    redis_client = await get_redis()
    cache = CacheService(redis_client)
    cache_key = _cache_key(request.description)
    cached = await cache.get(cache_key)
    if cached:
        return RoadmapGenerateResponse(
            id=cached["id"], share_token=cached["share_token"]
        )

    # Search GitHub for similar projects
    github = GitHubService()
    github_refs = []
    github_context = ""
    try:
        projects = await github.search_projects(request.description, limit=5)
        github_refs = projects
        if projects:
            analyses = []
            for p in projects[:3]:
                analysis = await github.analyze_project(p["full_name"])
                if analysis.get("readme_excerpt"):
                    analyses.append(f"- {analysis['full_name']}: {analysis['readme_excerpt'][:500]}")
            github_context = "\n".join(analyses)
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

    # Save to database with proper transaction handling
    try:
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
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save roadmap")

    # Cache the result
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
