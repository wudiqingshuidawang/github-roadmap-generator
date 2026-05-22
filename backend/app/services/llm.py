import json
import logging
import re

import anthropic
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """你是一个项目规划专家。根据用户想做的项目和 GitHub 上真实项目的数据，生成一份详细的学习路线图。

输出必须是严格的 JSON 格式，字段名必须使用英文（不要包含 markdown 代码块标记）。

JSON 结构示例：
{
  "tech_stack": [
    {"name": "Python", "reason": "..."}
  ],
  "phases": [
    {
      "name": "阶段名称",
      "duration": "2周",
      "tasks": [
        {
          "title": "任务标题",
          "description": "详细描述",
          "resources": [
            {"type": "github", "title": "资源标题", "url": "https://..."}
          ],
          "difficulty": "beginner",
          "dependencies": []
        }
      ]
    }
  ]
}

请确保：
1. 字段名必须是 tech_stack、phases、name、duration、tasks、title、description、resources、difficulty、dependencies（英文）
2. 每个阶段有 2-5 个任务
3. 共 3-5 个阶段
4. 学习资源的 URL 必须是真实存在的（优先使用提供的 GitHub 项目链接）
5. 任务描述要具体，不要泛泛而谈
"""


class LLMService:
    def __init__(self, api_key: str = "", model: str = ""):
        self.api_key = api_key or settings.anthropic_api_key
        self.model = model or settings.anthropic_model
        http_client = httpx.AsyncClient(trust_env=False)
        self.client = anthropic.AsyncAnthropic(
            api_key=self.api_key,
            base_url=settings.anthropic_base_url,
            http_client=http_client,
        )

    async def generate_roadmap(
        self, description: str, github_context: str = ""
    ) -> dict | None:
        user_prompt = f"用户想做的项目：{description}"
        if github_context:
            user_prompt += f"\n\n以下是 GitHub 上类似的热门项目及其技术栈：\n{github_context}"
        user_prompt += "\n\n请基于以上数据，生成学习路线图。"

        for attempt in range(3):
            try:
                response = await self.client.messages.create(
                    model=self.model,
                    max_tokens=4000,
                    system=SYSTEM_PROMPT,
                    messages=[
                        {"role": "user", "content": user_prompt},
                    ],
                )
                content = ""
                for block in response.content:
                    if hasattr(block, "text"):
                        content = block.text
                        break
                result = self._parse_response(content)
                if result:
                    return {
                        "data": result,
                        "model": self.model,
                        "tokens_used": response.usage.input_tokens + response.usage.output_tokens,
                    }
            except Exception as e:
                logger.warning("LLM attempt %d failed: %s: %s", attempt + 1, type(e).__name__, e)
                if attempt == 2:
                    raise
        return None

    def _parse_response(self, content: str) -> dict | None:
        # Try direct JSON parse
        for attempt_content in [content]:
            try:
                data = json.loads(attempt_content)
                normalized = self._normalize_keys(data)
                if normalized:
                    return normalized
            except json.JSONDecodeError:
                pass

        # Try extracting from markdown code block
        match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", content, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(1))
                normalized = self._normalize_keys(data)
                if normalized:
                    return normalized
            except json.JSONDecodeError:
                pass

        return None

    def _normalize_keys(self, data: dict) -> dict | None:
        """Normalize Chinese JSON keys to English."""
        if "phases" in data:
            return data

        # Map Chinese keys to English (expanded)
        key_map = {
            "项目阶段": "phases",
            "学习阶段": "phases",
            "阶段列表": "phases",
            "学习路线": "phases",
            "路线图": "phases",
            "技术栈": "tech_stack",
            "推荐技术栈": "tech_stack",
            "所需技术": "tech_stack",
        }
        for cn_key, en_key in key_map.items():
            if cn_key in data:
                data[en_key] = data.pop(cn_key)

        if "phases" in data:
            phase_key_map = {
                "阶段名称": "name",
                "名称": "name",
                "标题": "name",
                "持续时间": "duration",
                "预计时间": "duration",
                "时间": "duration",
                "任务列表": "tasks",
                "任务": "tasks",
                "步骤": "tasks",
            }
            task_key_map = {
                "任务标题": "title",
                "标题": "title",
                "名称": "title",
                "详细描述": "description",
                "描述": "description",
                "内容": "description",
                "学习资源": "resources",
                "资源": "resources",
                "参考": "resources",
                "难度": "difficulty",
                "级别": "difficulty",
                "依赖": "dependencies",
                "前置任务": "dependencies",
                "前置": "dependencies",
            }
            for phase in data["phases"]:
                for cn, en in phase_key_map.items():
                    if cn in phase:
                        phase[en] = phase.pop(cn)
                if "tasks" in phase:
                    for task in phase["tasks"]:
                        for cn, en in task_key_map.items():
                            if cn in task:
                                task[en] = task.pop(cn)
            return data

        return None
