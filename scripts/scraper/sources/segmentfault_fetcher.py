#!/usr/bin/env python3.13
"""
SegmentFault 数据抓取器 - 解析 Next.js __NEXT_DATA__ 内嵌 JSON
"""

import time
import re
import json
import urllib.request
import urllib.parse
from typing import List, Dict, Optional
from sources.github_fetcher import make_id, infer_difficulty, infer_category

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9",
}

SF_SEARCH = "https://segmentfault.com/search"
SF_BASE = "https://segmentfault.com"


def _get_html(url: str) -> Optional[str]:
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"    ⚠️ 请求失败 ({url}): {e}")
        return None


def _extract_next_data(html: str) -> Optional[dict]:
    """提取 Next.js __NEXT_DATA__ JSON"""
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def search_article_ids(keyword: str, page: int = 1) -> List[str]:
    """搜索文章，返回文章 ID 列表"""
    encoded = urllib.parse.quote(keyword)
    url = f"{SF_SEARCH}?q={encoded}&type=article&page={page}"
    html = _get_html(url)
    if not html:
        return []
    # 从链接提取 /a/<id>
    ids = re.findall(r'href="/a/(\d+)"', html)
    return list(dict.fromkeys(ids))  # 去重保序


def fetch_article(article_id: str, module: str) -> Optional[Dict]:
    """通过 __NEXT_DATA__ 抓取文章详情"""
    url = f"{SF_BASE}/a/{article_id}"
    html = _get_html(url)
    if not html:
        return None

    data = _extract_next_data(html)
    if not data:
        return None

    try:
        art_detail_map = data["props"]["pageProps"]["initialState"]["articleDetail"][
            "artDetail"
        ]
        art_wrapper = art_detail_map.get(article_id) or art_detail_map.get(
            int(article_id), None
        )
        if not art_wrapper:
            # 取第一个 key
            art_wrapper = next(iter(art_detail_map.values()), None)
        if not art_wrapper:
            return None

        article = art_wrapper.get("article", {})
        title = article.get("title", "").strip()
        parsed_text = article.get("parsed_text", "").strip()
        excerpt = article.get("excerpt", "").strip()
        real_views = article.get("real_views", 0) or 0
        votes = article.get("votes", 0) or 0

        # parsed_text 为空时从 HTML 提取正文 <p> 段落（兜底）
        if len(parsed_text) < 100:
            from bs4 import BeautifulSoup

            soup = BeautifulSoup(html, "lxml")
            article_el = soup.find("article")
            if article_el:
                parsed_text = article_el.get_text(separator="\n", strip=True)

        if not title or len(parsed_text) < 150:
            return None

        # 提取代码块
        code_examples = []
        for m_code in re.finditer(r"```(\w*)\n(.*?)```", parsed_text, re.DOTALL):
            lang = m_code.group(1) or "text"
            code = m_code.group(2).strip()
            if len(code) > 20:
                code_examples.append(
                    {"language": lang, "code": code, "description": ""}
                )

        # 关键点
        key_points = re.findall(r"^[-*]\s+(.{5,100})$", parsed_text, re.MULTILINE)[:8]

        # 标签
        tags_info = art_wrapper.get("tag", {})
        tags = []
        if isinstance(tags_info, dict):
            for v in tags_info.values():
                if isinstance(v, dict) and v.get("name"):
                    tags.append(v["name"])

        quality = min(100, 30 + votes * 2 + real_views // 200 + len(code_examples) * 10)

        return {
            "id": make_id("segmentfault", title),
            "module": module,
            "category": infer_category(title, module),
            "difficulty": infer_difficulty(title + " " + parsed_text[:300]),
            "title": title,
            "titleEn": "",
            "shortAnswer": (excerpt or parsed_text[:250])[:250],
            "shortAnswerEn": "",
            "detailedAnswer": parsed_text[:5000],
            "detailedAnswerEn": "",
            "codeExamples": code_examples[:3],
            "keyPoints": key_points,
            "keyPointsEn": [],
            "tags": tags[:8],
            "source": "segmentfault",
            "sourceUrl": url,
            "lang": "zh",
            "quality": quality,
            "createdAt": int(time.time() * 1000),
        }
    except Exception as e:
        print(f"    ⚠️ 解析失败 {article_id}: {e}")
        return None


def fetch_all(
    keywords: List[str], module: str, max_per_keyword: int = 20
) -> List[Dict]:
    """按关键词抓取 SF 文章"""
    all_questions = []
    seen_ids = set()

    for keyword in keywords:
        print(f"  🔍 SF 搜索: {keyword}")
        article_ids = search_article_ids(keyword)

        for art_id in article_ids[:max_per_keyword]:
            q = fetch_article(art_id, module)
            if q and q["id"] not in seen_ids and q["quality"] >= 20:
                seen_ids.add(q["id"])
                all_questions.append(q)
            time.sleep(1.5)

        print(f"    ✅ 累计 {len(all_questions)} 道题")
        time.sleep(2.0)

    return all_questions
