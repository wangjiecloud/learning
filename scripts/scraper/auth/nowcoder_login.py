#!/usr/bin/env python3.13
"""
牛客网自动登录脚本 - 使用 Playwright 打开浏览器让用户手动登录
登录成功后自动提取 Cookie 并写入 config.py

运行方式：
    cd projects/learning/scripts/scraper
    python3.13 auth/nowcoder_login.py
"""

import asyncio
import re
import sys
import os

# 确保在正确目录运行（避免与项目根目录的 logging 模块冲突）
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SCRAPER_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, SCRAPER_DIR)

from playwright.async_api import async_playwright


CONFIG_FILE = os.path.join(SCRAPER_DIR, "config.py")


def update_config(key: str, value: str):
    """将 key = value 写入 config.py"""
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # 替换现有配置行
    pattern = rf"^({re.escape(key)}\s*=\s*).*$"
    replacement = f'{key} = "{value}"'
    new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

    if new_content == content:
        # 如果没有找到，在文件末尾追加
        new_content += f'\n{key} = "{value}"\n'

    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        f.write(new_content)


async def login():
    print("=" * 60)
    print("牛客网自动登录工具")
    print("=" * 60)
    print()

    browser_data_dir = os.path.join(SCRAPER_DIR, "browser_data", "nowcoder")
    os.makedirs(browser_data_dir, exist_ok=True)

    async with async_playwright() as p:
        print("正在启动浏览器...")
        context = await p.chromium.launch_persistent_context(
            user_data_dir=browser_data_dir,
            headless=False,
            channel="chrome",  # 使用系统 Chrome，如果没有则去掉此行
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
            ],
            viewport={"width": 1280, "height": 800},
        )

        page = context.pages[0] if context.pages else await context.new_page()

        # 检测是否已有有效登录态
        await page.goto("https://www.nowcoder.com/")
        await page.wait_for_load_state("networkidle", timeout=10_000)

        is_logged_in = await page.evaluate("""
            () => {
                const userInfo = document.querySelector('.user-info-wrap, .nc-header-user');
                return !!userInfo;
            }
        """)

        if is_logged_in:
            print("✅ 检测到已有有效登录态，直接提取 Cookie...")
        else:
            print()
            print("👉 请在弹出的浏览器窗口中完成登录（支持微信扫码、账号密码等方式）")
            print("   登录成功后脚本会自动继续，请勿关闭浏览器窗口...")
            print()

            # 跳转到登录页
            await page.goto("https://www.nowcoder.com/login")

            # 等待登录成功信号：URL 跳转到首页或出现用户信息元素
            try:
                await page.wait_for_url(
                    lambda url: "nowcoder.com" in url and "/login" not in url,
                    timeout=180_000,  # 3 分钟超时
                )
                print("✅ 检测到登录成功！")
            except Exception:
                print("⚠️  等待超时，尝试直接提取当前 Cookie...")

        # 提取 Cookie
        cookies = await context.cookies(["https://www.nowcoder.com"])
        if not cookies:
            print("❌ 未能获取 Cookie，请确保登录成功后重试")
            await context.close()
            return

        # 拼接 Cookie 字符串
        cookie_str = "; ".join(f"{c['name']}={c['value']}" for c in cookies)

        # 写入 config.py
        update_config("NOWCODER_COOKIE", cookie_str)

        print(f"✅ 成功提取 {len(cookies)} 个 Cookie")
        print(f"   已写入 config.py")
        print()

        # 验证 Cookie 是否有效
        print("正在验证 Cookie 有效性...")
        import urllib.request

        req = urllib.request.Request(
            "https://www.nowcoder.com/api/user/getInfo",
            headers={
                "Cookie": cookie_str,
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                import json

                data = json.loads(resp.read().decode())
                if data.get("code") == 0:
                    username = data.get("data", {}).get("nickname", "未知用户")
                    print(f"✅ Cookie 有效！当前登录用户: {username}")
                else:
                    print(f"⚠️  Cookie 可能无效，响应: {data.get('msg', '未知错误')}")
        except Exception as e:
            print(f"⚠️  验证请求失败: {e}，但 Cookie 已保存，可能仍然有效")

        await context.close()
        print()
        print("现在可以运行 run_all.py 开始抓取数据了！")


if __name__ == "__main__":
    asyncio.run(login())
