#!/usr/bin/env python3.13
"""
GitHub 数据源抓取器
直接通过 GitHub API 获取仓库内容，解析 Markdown 提取题目
"""

import re
import time
import base64
import hashlib
import urllib.request
import urllib.parse
import json
from typing import List, Dict, Optional


class GitHubFetcher:
    BASE_API = "https://api.github.com"
    HEADERS = {
        "User-Agent": "LearnMate-Scraper/1.0",
        "Accept": "application/vnd.github.v3+json",
    }

    def __init__(self, token: Optional[str] = None):
        if token:
            self.HEADERS["Authorization"] = f"token {token}"

    def _get(self, url: str) -> dict:
        req = urllib.request.Request(url, headers=self.HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())

    def get_file_content(self, repo: str, path: str) -> Optional[str]:
        """获取仓库文件内容（返回文本）"""
        url = f"{self.BASE_API}/repos/{repo}/contents/{urllib.parse.quote(path)}"
        try:
            data = self._get(url)
            if data.get("encoding") == "base64":
                return base64.b64decode(data["content"]).decode(
                    "utf-8", errors="ignore"
                )
            return data.get("content", "")
        except Exception as e:
            print(f"    ⚠️ 获取文件失败 {repo}/{path}: {e}")
            return None

    def list_files(self, repo: str, path: str = "", ext: str = ".md") -> List[str]:
        """列出仓库目录中的文件"""
        url = f"{self.BASE_API}/repos/{repo}/contents/{urllib.parse.quote(path)}"
        try:
            items = self._get(url)
            if not isinstance(items, list):
                return []
            result = []
            for item in items:
                if item["type"] == "file" and item["name"].endswith(ext):
                    result.append(item["path"])
                elif item["type"] == "dir" and not item["name"].startswith("."):
                    # 递归子目录（限深度）
                    if path.count("/") < 2:
                        result.extend(self.list_files(repo, item["path"], ext))
            return result
        except Exception as e:
            print(f"    ⚠️ 列出文件失败 {repo}/{path}: {e}")
            return []


def make_id(source: str, title: str) -> str:
    """生成稳定的题目 ID"""
    h = hashlib.md5(f"{source}::{title}".encode()).hexdigest()[:10]
    return f"{source.replace('/', '_')}_{h}"


def infer_difficulty(text: str) -> str:
    """从文本内容推断难度"""
    text_lower = text.lower()
    expert_kw = [
        "高并发",
        "分布式事务",
        "底层原理",
        "千万级",
        "advanced",
        "expert",
        "p7",
        "p8",
        "一致性协议",
        "raft",
        "paxos",
        "jvm调优",
        "gc原理",
    ]
    junior_kw = [
        "什么是",
        "简介",
        "基础",
        "入门",
        "概念",
        "定义",
        "junior",
        "beginner",
        "introduction",
        "overview",
        "基本概念",
    ]

    for kw in expert_kw:
        if kw in text_lower:
            return "expert"
    for kw in junior_kw:
        if kw in text_lower:
            return "junior"
    return "senior"


def infer_category(title: str, module: str) -> str:
    """从标题推断分类"""
    title_lower = title.lower()

    if module == "architect":
        cats = {
            "systemDesign": [
                "系统设计",
                "system design",
                "设计一个",
                "how to design",
                "architecture",
            ],
            "microservice": [
                "微服务",
                "microservice",
                "service mesh",
                "grpc",
                "api gateway",
            ],
            "distributed": [
                "分布式",
                "distributed",
                "cap",
                "raft",
                "paxos",
                "一致性",
                "zookeeper",
            ],
            "database": [
                "数据库",
                "database",
                "mysql",
                "redis",
                "mongodb",
                "索引",
                "sql",
                "nosql",
            ],
            "performance": [
                "性能",
                "performance",
                "缓存",
                "cache",
                "jvm",
                "gc",
                "优化",
                "latency",
            ],
            "designPatterns": [
                "设计模式",
                "design pattern",
                "solid",
                "工厂",
                "单例",
                "观察者",
            ],
            "cloud": [
                "kubernetes",
                "k8s",
                "docker",
                "cloud",
                "云原生",
                "ci/cd",
                "devops",
            ],
            "security": ["安全", "security", "auth", "oauth", "jwt", "xss", "sql注入"],
            "ddd": ["ddd", "领域", "domain", "cqrs", "event sourcing"],
        }
    else:
        cats = {
            "llmBasic": [
                "transformer",
                "attention",
                "bert",
                "gpt",
                "llm",
                "大模型",
                "语言模型",
            ],
            "rag": ["rag", "检索增强", "retrieval", "vector", "向量", "embedding"],
            "agentFramework": [
                "agent",
                "langchain",
                "llamaindex",
                "autogpt",
                "react",
                "tool calling",
            ],
            "promptEngineering": [
                "prompt",
                "提示",
                "few-shot",
                "chain of thought",
                "cot",
            ],
            "multiAgent": ["多agent", "multi-agent", "orchestrator", "协作"],
            "evaluation": ["评估", "evaluation", "benchmark", "hallucination", "幻觉"],
            "engineering": [
                "工程",
                "engineering",
                "部署",
                "inference",
                "推理加速",
                "量化",
            ],
            "memory": ["memory", "记忆", "context", "长上下文"],
        }

    for cat, keywords in cats.items():
        for kw in keywords:
            if kw in title_lower:
                return cat
    return "other"


def parse_markdown_qa(
    content: str, module: str, source: str, source_url: str = "", lang: str = "en"
) -> List[Dict]:
    """
    解析 Markdown 内容，提取 QA 对
    支持两种格式：
    1. ## 标题 (问题) + 正文 (答案)
    2. **Q: 问题** / **A: 答案**
    """
    questions = []

    # 格式一：按 ## 标题分割
    sections = re.split(r"\n#{1,3} ", content)
    for section in sections[1:]:  # 跳过第一个（目录/介绍）
        lines = section.strip().split("\n")
        if not lines:
            continue

        title = lines[0].strip().rstrip("#").strip()
        body = "\n".join(lines[1:]).strip()

        # 过滤：太短、非问题标题
        if len(title) < 5 or len(body) < MIN_BODY_LEN:
            continue
        if title.lower() in (
            "table of contents",
            "introduction",
            "目录",
            "简介",
            "license",
            "contributing",
        ):
            continue

        # 提取代码块
        code_examples = []
        code_pattern = re.compile(r"```(\w*)\n(.*?)```", re.DOTALL)
        for match in code_pattern.finditer(body):
            lang_tag = match.group(1) or "text"
            code = match.group(2).strip()
            if len(code) > 20:
                code_examples.append(
                    {"language": lang_tag, "code": code, "description": ""}
                )

        # 提取关键点（列表项）
        key_points = re.findall(r"^[-*]\s+(.+)$", body, re.MULTILINE)
        key_points = [kp.strip() for kp in key_points[:8] if len(kp.strip()) > 5]

        # 简短答案 = 正文前 200 字符（去除代码块）
        clean_body = re.sub(r"```.*?```", "", body, flags=re.DOTALL).strip()
        short_answer = clean_body[:250].strip()
        if len(clean_body) > 250:
            short_answer += "..."

        q = {
            "id": make_id(source, title),
            "module": module,
            "category": infer_category(title, module),
            "difficulty": infer_difficulty(title + " " + body[:300]),
            "title": title,
            "titleEn": title if lang == "en" else "",
            "shortAnswer": short_answer,
            "shortAnswerEn": short_answer if lang == "en" else "",
            "detailedAnswer": body if lang == "zh" else "",
            "detailedAnswerEn": body if lang == "en" else "",
            "codeExamples": code_examples[:3],
            "keyPoints": key_points,
            "keyPointsEn": key_points if lang == "en" else [],
            "tags": list(
                set(
                    re.findall(
                        r"\b(CAP|REST|API|LLM|RAG|DDD|TDD|CQRS|gRPC|Redis|MySQL|Kafka|Docker|K8s|微服务|分布式|缓存|索引)\b",
                        title + " " + body[:500],
                    )
                )
            ),
            "source": source,
            "sourceUrl": source_url,
            "lang": lang,
            "quality": min(100, 50 + len(body) // 100 + len(code_examples) * 10),
            "createdAt": int(time.time() * 1000),
        }
        questions.append(q)

    return questions


MIN_BODY_LEN = 100


def fetch_all(repos_config: list) -> List[Dict]:
    """抓取所有 GitHub 仓库"""
    fetcher = GitHubFetcher()
    all_questions = []

    for repo_cfg in repos_config:
        repo = repo_cfg["repo"]
        module = repo_cfg["module"]
        lang = repo_cfg.get("lang", "en")
        print(f"\n  📦 {repo} ({module}, {lang})")

        # 先尝试 README
        readme_paths = [
            "README.md",
            "README_zh-Hans.md",
            "README-zh.md",
            "docs/README.md",
        ]
        for rp in readme_paths:
            content = fetcher.get_file_content(repo, rp)
            if content and len(content) > 1000:
                qs = parse_markdown_qa(
                    content,
                    module,
                    f"github/{repo}",
                    f"https://github.com/{repo}",
                    lang,
                )
                print(f"    ✅ {rp}: 提取 {len(qs)} 道题")
                all_questions.extend(qs)
                time.sleep(0.5)
                break

        # 列出其他 Markdown 文件
        md_files = fetcher.list_files(repo, ext=".md")
        for md_path in md_files[:20]:  # 最多抓 20 个文件
            if any(
                x in md_path.lower()
                for x in ["readme", "license", "contributing", "changelog"]
            ):
                continue
            content = fetcher.get_file_content(repo, md_path)
            if content and len(content) > 500:
                qs = parse_markdown_qa(
                    content,
                    module,
                    f"github/{repo}",
                    f"https://github.com/{repo}/blob/main/{md_path}",
                    lang,
                )
                if qs:
                    print(f"    ✅ {md_path}: 提取 {len(qs)} 道题")
                    all_questions.extend(qs)
            time.sleep(0.3)

    return all_questions


if __name__ == "__main__":
    from config import GITHUB_REPOS

    questions = fetch_all(GITHUB_REPOS)
    print(f"\n共提取 {len(questions)} 道题")
