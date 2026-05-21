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
        try:
            data = json.loads(content)
            if "phases" in data:
                return data
        except json.JSONDecodeError:
            pass

        match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", content, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(1))
                if "phases" in data:
                    return data
            except json.JSONDecodeError:
                pass

        return None
