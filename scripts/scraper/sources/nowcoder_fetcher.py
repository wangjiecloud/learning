#!/usr/bin/env python3.13
"""
牛客网数据抓取器
需要先运行 auth/nowcoder_login.py 获取 Cookie
"""

import json
import time
import re
import urllib.request
from typing import List, Dict, Optional
from sources.github_fetcher import make_id, infer_difficulty


NOWCODER_QUESTION_URL = "https://www.nowcoder.com/question/next"
NOWCODER_DISCUSS_URL = "https://www.nowcoder.com/discuss/experience"

# 难度映射
DIFFICULTY_MAP = {
    "0": "junior",  # 简单
    "1": "senior",  # 中等
    "2": "expert",  # 困难
    "simple": "junior",
    "medium": "senior",
    "hard": "expert",
}


def _get(url: str, cookie: str) -> Optional[str]:
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Cookie": cookie,
        "Referer": "https://www.nowcoder.com/",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"    ⚠️ 请求失败 {url}: {e}")
        return None


def fetch_questions_by_tag(
    tag_id: str, category: str, module: str, cookie: str, max_pages: int = 20
) -> List[Dict]:
    """按知识点标签抓取题目列表"""
    questions = []
    seen = set()

    for page in range(1, max_pages + 1):
        url = f"{NOWCODER_QUESTION_URL}?questionJobId=10&examType=0&tagIds={tag_id}&page={page}"
        html = _get(url, cookie)
        if not html:
            break

        # 解析题目列表（牛客网 SSR，直接从 HTML 提取 JSON 数据）
        # 查找 window.__INITIAL_DATA__ 或 next-data
        json_match = re.search(
            r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL
        )
        if not json_match:
            # 尝试直接解析 HTML
            titles = re.findall(
                r'<p class="question-title"[^>]*>(.*?)</p>', html, re.DOTALL
            )
            for title in titles:
                title = re.sub(r"<.*?>", "", title).strip()
                if title and len(title) > 5:
                    q = {
                        "id": make_id("nowcoder", title),
                        "module": module,
                        "category": category,
                        "difficulty": "senior",
                        "title": title,
                        "titleEn": "",
                        "shortAnswer": f"请参考牛客网原题：{title}",
                        "shortAnswerEn": "",
                        "detailedAnswer": "",
                        "detailedAnswerEn": "",
                        "codeExamples": [],
                        "keyPoints": [],
                        "keyPointsEn": [],
                        "tags": [],
                        "source": "nowcoder",
                        "sourceUrl": url,
                        "lang": "zh",
                        "quality": 60,
                        "createdAt": int(time.time() * 1000),
                    }
                    if q["id"] not in seen:
                        seen.add(q["id"])
                        questions.append(q)
            time.sleep(2.5)
            continue

        try:
            data = json.loads(json_match.group(1))
            items = data.get("props", {}).get("pageProps", {}).get("questionList", [])
            if not items:
                break

            for item in items:
                title = item.get("title", "").strip()
                difficulty_raw = str(item.get("difficulty", "1"))
                difficulty = DIFFICULTY_MAP.get(difficulty_raw, "senior")
                qid = str(item.get("questionId", ""))

                if not title or make_id("nowcoder", title) in seen:
                    continue

                answer_html = item.get("answer", "") or item.get("content", "")
                answer_text = re.sub(r"<.*?>", "", answer_html).strip()

                q = {
                    "id": make_id("nowcoder", title),
                    "module": module,
                    "category": category,
                    "difficulty": difficulty,
                    "title": title,
                    "titleEn": "",
                    "shortAnswer": answer_text[:250]
                    if answer_text
                    else f"见牛客原题: {title}",
                    "shortAnswerEn": "",
                    "detailedAnswer": answer_text[:5000]
                    if len(answer_text) > 250
                    else "",
                    "detailedAnswerEn": "",
                    "codeExamples": [],
                    "keyPoints": [],
                    "keyPointsEn": [],
                    "tags": [],
                    "source": "nowcoder",
                    "sourceUrl": f"https://www.nowcoder.com/questionDetail/{qid}"
                    if qid
                    else url,
                    "lang": "zh",
                    "quality": 70 if answer_text else 45,
                    "createdAt": int(time.time() * 1000),
                }
                seen.add(q["id"])
                questions.append(q)
        except Exception as e:
            print(f"    ⚠️ 解析失败 page={page}: {e}")

        print(f"    ✅ tag={tag_id} page={page}: 累计 {len(questions)} 道")
        time.sleep(2.5)

    return questions


def fetch_all(tags: Dict[str, str], module: str, cookie: str) -> List[Dict]:
    """抓取所有标签的题目"""
    if not cookie:
        print("  ⚠️  牛客网 Cookie 未配置，跳过。请先运行 auth/nowcoder_login.py")
        return []

    all_questions = []
    for tag_id, category in tags.items():
        print(f"  📌 牛客网 tag={tag_id} ({category})")
        qs = fetch_questions_by_tag(tag_id, category, module, cookie)
        all_questions.extend(qs)
        print(f"    共 {len(qs)} 道题")
        time.sleep(3.0)

    return all_questions
