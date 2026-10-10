#!/usr/bin/env python3.13
"""
LearnMate 爬虫主入口
一键抓取所有数据源，清洗去重后输出到 app/data/ 目录

运行方式：
    cd projects/learning/scripts/scraper
    python3.13 run_all.py

选项：
    python3.13 run_all.py --github-only     仅抓 GitHub（测试用）
    python3.13 run_all.py --skip-nowcoder   跳过牛客（没有 Cookie 时）
"""

import sys
import os
import json
import time
import argparse

# ── 关键：确保从 scraper 目录运行，避免根目录 logging 模块冲突 ──
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if os.getcwd() != SCRIPT_DIR:
    print(f"⚠️  请从 scraper 目录运行:")
    print(f"   cd {SCRIPT_DIR}")
    print(f"   python3.13 run_all.py")
    sys.exit(1)

sys.path.insert(0, SCRIPT_DIR)

# 导入配置
from config import (
    NOWCODER_COOKIE,
    JUEJIN_COOKIE,
    ARCHITECT_KEYWORDS,
    AGENT_KEYWORDS,
    GITHUB_REPOS,
    NOWCODER_TAGS,
    MIN_CONTENT_LENGTH,
    MIN_QUALITY_SCORE,
    OUTPUT_DIR,
)

# 导入爬虫
from sources.github_fetcher import fetch_all as github_fetch
from sources.juejin_fetcher import fetch_all as juejin_fetch
from sources.nowcoder_fetcher import fetch_all as nowcoder_fetch
from sources.segmentfault_fetcher import fetch_all as sf_fetch
from processor.cleaner import (
    apply_cleaning,
    deduplicate,
    filter_quality,
    split_by_module,
)


def main():
    parser = argparse.ArgumentParser(description="LearnMate 题库爬虫")
    parser.add_argument("--github-only", action="store_true", help="仅抓 GitHub")
    parser.add_argument("--skip-nowcoder", action="store_true", help="跳过牛客网")
    parser.add_argument("--skip-juejin", action="store_true", help="跳过掘金")
    parser.add_argument("--skip-sf", action="store_true", help="跳过 SF")
    args = parser.parse_args()

    print("=" * 60)
    print("LearnMate 题库爬虫启动")
    print("=" * 60)
    print()

    all_questions = []
    start_time = time.time()

    # ── 1. GitHub（最高优先级，零风险）──
    print("📦 [1/4] GitHub awesome 系列...")
    try:
        gh_qs = github_fetch(GITHUB_REPOS)
        if gh_qs:
            print(f"   ✅ GitHub 抓取完成: {len(gh_qs)} 道题")
        else:
            print("   ⚠️  GitHub 匿名 rate limit（60次/小时），本次跳过")
        all_questions.extend(gh_qs)
    except Exception as e:
        print(f"   ❌ GitHub 抓取失败: {e}")

    if args.github_only:
        print("\n仅运行 GitHub，跳过其他数据源")
    else:
        # ── 2. 掘金 ──
        if not args.skip_juejin:
            print(f"\n📰 [2/4] 掘金...")
            try:
                juejin_arch = juejin_fetch(
                    ARCHITECT_KEYWORDS, "architect", JUEJIN_COOKIE
                )
                juejin_agent = juejin_fetch(AGENT_KEYWORDS, "agent", JUEJIN_COOKIE)
                total = len(juejin_arch) + len(juejin_agent)
                print(
                    f"   ✅ 掘金抓取完成: {total} 道题（架构师 {len(juejin_arch)}, Agent {len(juejin_agent)}）"
                )
                all_questions.extend(juejin_arch)
                all_questions.extend(juejin_agent)
            except Exception as e:
                print(f"   ❌ 掘金抓取失败: {e}")

        # ── 3. SegmentFault ──
        if not args.skip_sf:
            print(f"\n💬 [3/4] SegmentFault...")
            try:
                sf_arch = sf_fetch(ARCHITECT_KEYWORDS[:5], "architect")
                sf_agent = sf_fetch(AGENT_KEYWORDS[:5], "agent")
                total = len(sf_arch) + len(sf_agent)
                print(f"   ✅ SF 抓取完成: {total} 道题")
                all_questions.extend(sf_arch)
                all_questions.extend(sf_agent)
            except Exception as e:
                print(f"   ❌ SF 抓取失败: {e}")

        # ── 4. 牛客网 ──
        if not args.skip_nowcoder:
            print(f"\n🐮 [4/4] 牛客网...")
            if not NOWCODER_COOKIE:
                print("   ⚠️  Cookie 未配置，跳过。请先运行 auth/nowcoder_login.py")
            else:
                try:
                    # 架构师相关 tag
                    arch_tags = {
                        k: v
                        for k, v in NOWCODER_TAGS.items()
                        if v not in ("llmBasic", "engineering")
                    }
                    agent_tags = {
                        k: v
                        for k, v in NOWCODER_TAGS.items()
                        if v in ("llmBasic", "engineering")
                    }

                    nc_arch = nowcoder_fetch(arch_tags, "architect", NOWCODER_COOKIE)
                    nc_agent = nowcoder_fetch(agent_tags, "agent", NOWCODER_COOKIE)
                    total = len(nc_arch) + len(nc_agent)
                    print(f"   ✅ 牛客网抓取完成: {total} 道题")
                    all_questions.extend(nc_arch)
                    all_questions.extend(nc_agent)
                except Exception as e:
                    print(f"   ❌ 牛客网抓取失败: {e}")

    # ── 数据处理 ──
    print(f"\n{'=' * 60}")
    print(f"📊 数据处理中...")
    print(f"   原始题目总数: {len(all_questions)}")

    # 清洗
    all_questions = apply_cleaning(all_questions)

    # 过滤低质量
    before = len(all_questions)
    all_questions = filter_quality(all_questions, MIN_QUALITY_SCORE, MIN_CONTENT_LENGTH)
    print(
        f"   质量过滤后: {len(all_questions)} 道（过滤 {before - len(all_questions)} 道）"
    )

    # 去重
    all_questions, dup_count = deduplicate(all_questions)
    print(f"   去重后: {len(all_questions)} 道（去除 {dup_count} 条重复）")

    # 按模块分组
    architect_qs, agent_qs = split_by_module(all_questions)
    print(f"   架构师: {len(architect_qs)} 道")
    print(f"   Agent:  {len(agent_qs)} 道")

    # 难度分布
    for module_name, qs in [("架构师", architect_qs), ("Agent", agent_qs)]:
        junior = sum(1 for q in qs if q["difficulty"] == "junior")
        senior = sum(1 for q in qs if q["difficulty"] == "senior")
        expert = sum(1 for q in qs if q["difficulty"] == "expert")
        print(
            f"   {module_name} 难度分布: 入门 {junior} / 进阶 {senior} / 高级 {expert}"
        )

    # ── 输出到 data 目录 ──
    output_dir = os.path.normpath(os.path.join(SCRIPT_DIR, OUTPUT_DIR))
    os.makedirs(output_dir, exist_ok=True)

    arch_path = os.path.join(output_dir, "architect-questions.json")
    agent_path = os.path.join(output_dir, "agent-questions.json")

    # 合并内置示例题（不覆盖）
    def merge_with_builtin(new_qs: list, existing_path: str) -> list:
        if os.path.exists(existing_path):
            with open(existing_path, "r", encoding="utf-8") as f:
                existing = json.load(f)
            builtin = [q for q in existing if q.get("source") == "builtin"]
            new_ids = {q["id"] for q in new_qs}
            builtin_to_keep = [q for q in builtin if q["id"] not in new_ids]
            return builtin_to_keep + new_qs
        return new_qs

    final_arch = merge_with_builtin(architect_qs, arch_path)
    final_agent = merge_with_builtin(agent_qs, agent_path)

    with open(arch_path, "w", encoding="utf-8") as f:
        json.dump(final_arch, f, ensure_ascii=False, indent=2)

    with open(agent_path, "w", encoding="utf-8") as f:
        json.dump(final_agent, f, ensure_ascii=False, indent=2)

    elapsed = int(time.time() - start_time)
    print(f"\n{'=' * 60}")
    print(f"✅ 完成！耗时 {elapsed // 60}m {elapsed % 60}s")
    print(f"   📁 {arch_path} ({len(final_arch)} 道)")
    print(f"   📁 {agent_path} ({len(final_agent)} 道)")
    print(f"\n重启 App 后题库将自动更新")


if __name__ == "__main__":
    main()
