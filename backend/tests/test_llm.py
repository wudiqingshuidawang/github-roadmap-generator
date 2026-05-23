import json

import pytest

from app.services.llm import LLMService


def test_parse_roadmap_json():
    service = LLMService(api_key="test", model="gpt-4", base_url="https://api.anthropic.com")
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
    service = LLMService(api_key="test", model="gpt-4", base_url="https://api.anthropic.com")
    result = service._parse_response("not valid json")
    assert result is None


def test_extract_json_from_markdown():
    service = LLMService(api_key="test", model="gpt-4", base_url="https://api.anthropic.com")
    markdown = 'Here is the roadmap:\n```json\n{"tech_stack": [], "phases": []}\n```'
    result = service._parse_response(markdown)
    assert result is not None
    assert "phases" in result
