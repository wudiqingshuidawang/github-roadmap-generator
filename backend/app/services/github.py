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
        stop_words = {"我", "想", "做", "一个", "的", "和", "是", "在", "有", "了", "就", "不"}
        # Extract ASCII words
        ascii_words = re.findall(r"[a-zA-Z0-9_]+", description)
        # Extract Chinese character sequences
        chinese_sequences = re.findall(r"[一-鿿]+", description)
        # Generate 2-character n-grams from Chinese sequences to capture compound words
        chinese_ngrams = []
        for seq in chinese_sequences:
            for i in range(len(seq) - 1):
                chinese_ngrams.append(seq[i : i + 2])
        all_words = ascii_words + chinese_ngrams
        return [w for w in all_words if w not in stop_words and len(w) > 1]

    def _build_search_query(self, description: str) -> str:
        keywords = self._extract_keywords(description)
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
