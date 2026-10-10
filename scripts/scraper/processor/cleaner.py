#!/usr/bin/env python3.13
"""
数据清洗和去重处理器
"""

import re
import hashlib
from typing import List, Dict, Tuple


# 广告/推广关键词黑名单
SPAM_PATTERNS = [
    r"扫码关注",
    r"微信公众号",
    r"点击关注",
    r"打赏作者",
    r"转载请注明",
    r"版权声明",
    r"原文链接",
    r"阅读原文",
    r"更多精彩",
    r"欢迎star",
    r"如有.*问题.*联系",
    r"私信.*领取",
]

SPAM_RE = re.compile("|".join(SPAM_PATTERNS), re.IGNORECASE)


def clean_text(text: str) -> str:
    """清洗文本：去广告、多余空行、HTML残留"""
    if not text:
        return text

    # 去除 HTML 标签残留
    text = re.sub(r"<[^>]+>", "", text)

    # 按行过滤广告
    lines = text.split("\n")
    clean_lines = [line for line in lines if not SPAM_RE.search(line)]
    text = "\n".join(clean_lines)

    # 合并多余空行（超过 2 个连续空行 → 2 个）
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def title_hash(title: str) -> str:
    """计算标题的相似度哈希（去除标点、大小写标准化）"""
    normalized = re.sub(r"[^\w\u4e00-\u9fff]", "", title.lower())
    return normalized


def deduplicate(questions: List[Dict]) -> Tuple[List[Dict], int]:
    """
    去重：相同 id 或标题相似度 > 85% 的保留 quality 最高的
    返回: (去重后列表, 删除数量)
    """
    seen_ids = {}  # id → question
    seen_titles = {}  # title_hash → question
    duplicates = 0

    for q in questions:
        qid = q["id"]
        t_hash = title_hash(q.get("title", ""))

        # 先检查 ID 是否重复
        if qid in seen_ids:
            existing = seen_ids[qid]
            if q.get("quality", 0) > existing.get("quality", 0):
                seen_ids[qid] = q
                seen_titles[t_hash] = q
            duplicates += 1
            continue

        # 再检查标题相似度
        if t_hash in seen_titles and len(t_hash) > 5:
            existing = seen_titles[t_hash]
            if q.get("quality", 0) > existing.get("quality", 0):
                old_id = existing["id"]
                del seen_ids[old_id]
                seen_ids[qid] = q
                seen_titles[t_hash] = q
            duplicates += 1
            continue

        seen_ids[qid] = q
        seen_titles[t_hash] = q

    result = list(seen_ids.values())
    return result, duplicates


def filter_quality(
    questions: List[Dict], min_quality: int = 20, min_content_len: int = 100
) -> List[Dict]:
    """过滤低质量题目（内容长度检查 detailedAnswer，而非 shortAnswer）"""
    return [
        q
        for q in questions
        if q.get("quality", 0) >= min_quality
        and len(q.get("detailedAnswer", "") or q.get("shortAnswer", ""))
        >= min_content_len
    ]


def apply_cleaning(questions: List[Dict]) -> List[Dict]:
    """对所有题目应用清洗"""
    for q in questions:
        q["shortAnswer"] = clean_text(q.get("shortAnswer", ""))
        q["shortAnswerEn"] = clean_text(q.get("shortAnswerEn", ""))
        q["detailedAnswer"] = clean_text(q.get("detailedAnswer", ""))
        q["detailedAnswerEn"] = clean_text(q.get("detailedAnswerEn", ""))
        q["title"] = clean_text(q.get("title", ""))

        # 确保必填字段存在
        for field in ["codeExamples", "keyPoints", "keyPointsEn", "tags"]:
            if not isinstance(q.get(field), list):
                q[field] = []

    return questions


def split_by_module(questions: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
    """按 module 分组"""
    architect = [q for q in questions if q.get("module") == "architect"]
    agent = [q for q in questions if q.get("module") == "agent"]
    return architect, agent
