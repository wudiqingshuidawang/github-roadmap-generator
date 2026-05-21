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
