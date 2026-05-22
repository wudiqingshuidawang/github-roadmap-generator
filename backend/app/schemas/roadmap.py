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


class LLMOutput(BaseModel):
    tech_stack: list[TechStackItem]
    phases: list[Phase]


class RoadmapGenerateRequest(BaseModel):
    description: str = Field(min_length=5, max_length=2000, description="Project description")


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
