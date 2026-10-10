#!/usr/bin/env python3.13
"""
掘金数据抓取器 - 使用掘金内部 JSON API
无需 Selenium，直接 POST 请求
"""

import json
import time
import re
import hashlib
import urllib.request
from typing import List, Dict, Optional
from sources.github_fetcher import make_id, infer_difficulty, infer_category

try:
    from bs4 import BeautifulSoup

    _BS4_AVAILABLE = True
except ImportError:
    _BS4_AVAILABLE = False


JUEJIN_SEARCH_URL = "https://api.juejin.cn/search_api/v1/search"
JUEJIN_DETAIL_URL = "https://api.juejin.cn/content_api/v1/article/detail"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Content-Type": "application/json",
    "Origin": "https://juejin.cn",
    "Referer": "https://juejin.cn/",
}


def _post(url: str, payload: dict, cookie: str = "") -> Optional[dict]:
    data = json.dumps(payload).encode()
    headers = {**HEADERS}
    if cookie:
        headers["Cookie"] = cookie
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"    ⚠️ 请求失败: {e}")
        return None


def search_articles(
    keyword: str, cursor: int = 0, limit: int = 20, cookie: str = ""
) -> List[dict]:
    """搜索文章列表"""
    payload = {
        "key_word": keyword,
        "search_type": 0,  # int，不是 str
        "cursor": str(cursor),
        "limit": limit,
        "sort_type": 0,
    }
    data = _post(JUEJIN_SEARCH_URL, payload, cookie)
    if not data or data.get("err_no") != 0:
        return []
    return data.get("data", [])


def get_article_detail(article_id: str, cookie: str = "") -> Optional[dict]:
    """获取文章详情"""
    payload = {"article_id": article_id}
    data = _post(JUEJIN_DETAIL_URL, payload, cookie)
    if not data or data.get("err_no") != 0:
        return None
    return data.get("data", {})


def parse_article(article_data: dict, module: str) -> Optional[Dict]:
    """将掘金文章转换为标准题目格式"""
    info = article_data.get("article_info", {}) or article_data
    title = info.get("title", "").strip()
    content = (
        info.get("mark_content", "")
        or info.get("content", "")
        or info.get("brief_content", "")
    )
    brief = info.get("brief_content", "")

    if not title or not content:
        return None
    if len(content) < 50:
        return None

    # 清理内容
    content = re.sub(r"!\[.*?\]\(.*?\)", "", content)  # 去图片
    content = re.sub(r"\[关注\].*", "", content, flags=re.DOTALL)  # 去推广
    content = re.sub(r"(扫码|微信|公众号|打赏).{0,50}\n", "", content)

    # 提取代码块
    code_examples = []
    for m in re.finditer(r"```(\w*)\n(.*?)```", content, re.DOTALL):
        lang_tag = m.group(1) or "text"
        code = m.group(2).strip()
        if len(code) > 20:
            code_examples.append(
                {"language": lang_tag, "code": code, "description": ""}
            )

    # 关键点
    key_points = re.findall(r"^[-*]\s+(.+)$", content, re.MULTILINE)
    key_points = [kp.strip() for kp in key_points[:8] if len(kp.strip()) > 5]

    # 质量分（基于点赞、阅读数、内容长度）
    digg_count = info.get("digg_count", 0) or 0
    view_count = info.get("view_count", 0) or 0
    quality = min(100, int(digg_count * 0.5 + view_count * 0.01 + len(content) / 50))

    article_id = info.get("article_id", "")
    source_url = f"https://juejin.cn/post/{article_id}" if article_id else ""

    return {
        "id": make_id("juejin", title),
        "module": module,
        "category": infer_category(title, module),
        "difficulty": infer_difficulty(title + " " + content[:300]),
        "title": title,
        "titleEn": "",
        "shortAnswer": (brief or content[:250]).strip()[:250],
        "shortAnswerEn": "",
        "detailedAnswer": content[:5000],  # 限制长度
        "detailedAnswerEn": "",
        "codeExamples": code_examples[:3],
        "keyPoints": key_points,
        "keyPointsEn": [],
        "tags": list(
            set(
                re.findall(
                    r"\b(微服务|分布式|缓存|Redis|MySQL|K8s|LLM|RAG|Agent|Prompt|向量|Transformer|架构)\b",
                    title + content[:500],
                )
            )
        ),
        "source": "juejin",
        "sourceUrl": source_url,
        "lang": "zh",
        "quality": quality,
        "createdAt": int(time.time() * 1000),
    }


def fetch_article_html(article_id: str) -> Optional[str]:
    """直接从掘金文章页面抓取正文（BeautifulSoup 解析，移除 style/script）"""
    url = f"https://juejin.cn/post/{article_id}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
    except Exception:
        return None

    if _BS4_AVAILABLE:
        soup = BeautifulSoup(html, "lxml")
        article = soup.find("article")
        if not article:
            return None
        # 先移除 style / script / svg / 图片说明等噪音标签
        for tag in article.find_all(
            ["style", "script", "svg", "img", "figure", "meta"]
        ):
            tag.decompose()
        # 提取纯文本，保留换行结构
        text = article.get_text(separator="\n", strip=True)
    else:
        # fallback：正则方案（先去掉 <style>...</style> 块）
        m = re.search(r"<article[^>]*>(.*?)</article>", html, re.DOTALL)
        if not m:
            return None
        inner = m.group(1)
        inner = re.sub(r"<style[^>]*>.*?</style>", "", inner, flags=re.DOTALL)
        inner = re.sub(r"<script[^>]*>.*?</script>", "", inner, flags=re.DOTALL)
        text = re.sub(r"<[^>]+>", " ", inner)

    # 清理：合并多余空白行
    lines = [line.strip() for line in text.split("\n")]

    # 过滤策略：第一行是标题，保留；紧接着最多跳过 5 行"噪音行"
    # 噪音行判定：纯数字/日期/阅读时间/无汉字内容的短行
    _noise_re = re.compile(r"^[\d,，\s\-\.:/年月日阅读分钟关注点赞收藏评论字]+$")
    content_lines = []
    title_seen = False
    noise_budget = 5  # 标题后最多连续跳过 5 个噪音行

    for line in lines:
        if not line:
            if content_lines:
                content_lines.append("")
            continue

        if not title_seen:
            title_seen = True
            content_lines.append(line)
            continue

        # 在噪音预算内，跳过无实质汉字内容的短行
        if noise_budget > 0:
            has_cn = bool(re.search(r"[\u4e00-\u9fff]{2,}", line))  # 含 ≥2 个连续汉字
            is_noise = _noise_re.match(line) or (not has_cn and len(line) <= 12)
            if is_noise:
                noise_budget -= 1
                continue
            else:
                noise_budget = 0  # 进入正文区，不再过滤

        content_lines.append(line)

    text = "\n".join(content_lines)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()

    return text if len(text) > 100 else None


def fetch_all(
    keywords: List[str], module: str, cookie: str = "", max_per_keyword: int = 30
) -> List[Dict]:
    """按关键词抓取掘金文章（直接用搜索结果，不调详情接口）"""
    all_questions = []
    seen_ids = set()

    for keyword in keywords:
        print(f"  🔍 掘金搜索: {keyword}")
        search_results = search_articles(keyword, limit=max_per_keyword, cookie=cookie)

        for item in search_results:
            # 新结构：result_model.article_info
            article_info = item.get("result_model", {}).get(
                "article_info", {}
            ) or item.get("article_info", {})
            if not article_info:
                continue

            article_id = article_info.get("article_id", "")

            # 尝试从 HTML 页面抓完整正文
            full_text = fetch_article_html(article_id) if article_id else None
            if full_text:
                article_info = dict(article_info)
                article_info["mark_content"] = full_text

            q = parse_article({"article_info": article_info}, module)
            if q and q["id"] not in seen_ids and q["quality"] >= 10:
                seen_ids.add(q["id"])
                all_questions.append(q)

            time.sleep(1.5)

        print(f"    ✅ 已提取 {len(all_questions)} 道题（累计）")
        time.sleep(1.5)

    return all_questions
