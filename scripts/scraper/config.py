# ============================================================
# LearnMate 爬虫配置文件
# 在运行爬虫之前，请先运行 auth/nowcoder_login.py 获取 Cookie
# ============================================================

# ── 牛客网 Cookie（运行 auth/nowcoder_login.py 后自动写入）──
NOWCODER_COOKIE = ""

# ── 掘金 Cookie（可选，不登录也能抓大部分内容）──
JUEJIN_COOKIE = ""

# ── 通用请求头 ──
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}

# ── 请求延迟（秒）──
REQUEST_DELAY = 1.5  # 普通请求间隔
NOWCODER_DELAY = 2.5  # 牛客网更保守

# ── 质量过滤阈值 ──
MIN_CONTENT_LENGTH = 150  # 正文少于 150 字符的跳过
MIN_QUALITY_SCORE = 20  # 质量分低于 20 的跳过

# ── 输出目录（相对于项目根目录）──
OUTPUT_DIR = "../../data"

# ── 架构师题库搜索关键词 ──
ARCHITECT_KEYWORDS = [
    "软件架构师面试题",
    "系统设计面试题",
    "微服务架构面试",
    "分布式系统面试题",
    "设计模式面试题",
    "高并发系统设计",
    "DDD领域驱动设计面试",
    "云原生架构面试",
    "数据库架构面试题",
    "性能优化面试题",
    "架构师必备知识点",
    "后端架构面试题",
    "消息队列面试题",
    "缓存设计面试题",
    "负载均衡面试题",
]

# ── Agent/LLM 题库搜索关键词 ──
AGENT_KEYWORDS = [
    "AI Agent面试题",
    "大模型LLM面试题",
    "RAG检索增强面试题",
    "LangChain面试题",
    "Prompt工程面试",
    "ChatGPT原理面试",
    "Transformer面试题",
    "向量数据库面试题",
    "多智能体面试题",
    "LLM应用开发面试",
    "Fine-tuning微调面试",
    "AI工程师面试题",
    "NLP面试题",
    "机器学习面试题",
]

# ── GitHub 目标仓库 ──
GITHUB_REPOS = [
    # 架构师相关
    {"repo": "donnemartin/system-design-primer", "module": "architect", "lang": "both"},
    {"repo": "ByteByteGoHq/system-design-101", "module": "architect", "lang": "en"},
    {"repo": "wolverinn/Waking-Up", "module": "architect", "lang": "zh"},
    {
        "repo": "arialdomartini/Back-End-Developer-Interview-Questions",
        "module": "architect",
        "lang": "en",
    },
    # Agent 相关
    {"repo": "openai/openai-cookbook", "module": "agent", "lang": "en"},
    {"repo": "e2b-dev/awesome-ai-agents", "module": "agent", "lang": "en"},
]

# ── 牛客网目标分类（tagId → 分类名）──
NOWCODER_TAGS = {
    # 架构师相关
    "134": "systemDesign",  # 系统设计
    "135": "microservice",  # 微服务
    "136": "distributed",  # 分布式
    "57": "database",  # 数据库
    "58": "performance",  # 性能优化
    "133": "designPatterns",  # 设计模式
    # Agent/算法相关
    "137": "llmBasic",  # 机器学习
    "138": "engineering",  # 算法工程
}

# ── CSDN 预配置 URL 列表（手动收集的高质量文章）──
CSDN_URLS = [
    # 在这里添加 CSDN 文章 URL
    # 例如: "https://blog.csdn.net/xxx/article/details/12345"
]
