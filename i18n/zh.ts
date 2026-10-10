export default {
  // 通用
  common: {
    search: '搜索',
    filter: '筛选',
    cancel: '取消',
    confirm: '确认',
    delete: '删除',
    loading: '加载中...',
    empty: '暂无内容',
    error: '加载失败',
    retry: '重试',
    all: '全部',
    save: '保存',
    close: '关闭',
    back: '返回',
    more: '更多',
    settings: '设置',
    language: '语言',
    theme: '主题',
    darkMode: '深色模式',
    lightMode: '浅色模式',
  },

  // Tab 导航
  tabs: {
    home: '首页',
    architect: '架构师',
    agent: 'Agent',
    bookstore: '书城',
  },

  // 首页 Dashboard
  home: {
    title: 'LearnMate',
    subtitle: '你的私人学习助手',
    totalQuestions: '总题数',
    mastered: '已掌握',
    learning: '学习中',
    reviewing: '待复习',
    starred: '已收藏',
    todayGoal: '今日目标',
    streak: '连续学习',
    days: '天',
    keepGoing: '继续加油！',
    progressTitle: '学习进度',
    recentActivity: '最近学习',
    architectProgress: '架构师题库进度',
    agentProgress: 'Agent 题库进度',
  },

  // 题库通用
  questions: {
    difficulty: '难度',
    category: '分类',
    source: '来源',
    tags: '标签',
    answer: '答案',
    analysis: '详细解析',
    examples: '示例',
    keyPoints: '知识要点',
    references: '延伸阅读',
    markMastered: '标为已掌握',
    markReviewing: '加入复习',
    markStar: '收藏',
    unmarkMastered: '取消已掌握',
    unmarkReviewing: '取消复习',
    unmarkStar: '取消收藏',
    expandAnswer: '展开答案',
    collapseAnswer: '收起答案',
    noResults: '没有找到相关题目',
    searchPlaceholder: '搜索题目...',
  },

  // 题目状态 Tab
  statusTabs: {
    all: '全部',
    unread: '待学习',
    learning: '学习中',
    reviewing: '待复习',
    starred: '收藏',
    mastered: '已掌握',
  },

  // 难度
  difficulty: {
    junior: '入门',
    senior: '进阶',
    expert: '高级',
  },

  // 架构师模块
  architect: {
    title: '软件架构师',
    subtitle: '系统设计 · 架构原则 · 分布式',
    categories: {
      systemDesign: '系统设计',
      designPatterns: '设计模式',
      distributed: '分布式系统',
      performance: '性能优化',
      microservice: '微服务',
      ddd: '领域驱动设计',
      cloud: '云原生',
      database: '数据库',
      security: '安全',
      other: '其他',
    },
  },

  // Agent 模块
  agent: {
    title: 'Agent 开发',
    subtitle: 'LLM · RAG · 多智能体',
    categories: {
      llmBasic: 'LLM 基础',
      agentFramework: 'Agent 框架',
      rag: 'RAG 检索增强',
      promptEngineering: 'Prompt 工程',
      multiAgent: '多 Agent',
      evaluation: '评估优化',
      engineering: '工程实践',
      tools: '工具调用',
      memory: '记忆管理',
      other: '其他',
    },
  },

  // 书城
  bookstore: {
    title: '书城',
    subtitle: '上传你的文档，随时阅读',
    upload: '上传文档',
    uploadHint: '支持 PDF、TXT、MD 格式',
    myBooks: '我的书库',
    emptyLibrary: '还没有书，快去上传吧',
    uploadSuccess: '上传成功',
    uploadFailed: '上传失败',
    deleteBook: '删除书籍',
    deleteConfirm: '确定删除这本书吗？',
    lastRead: '上次阅读',
    fileSize: '文件大小',
    format: '格式',
    readNow: '立即阅读',
    continueReading: '继续阅读',
    progress: '阅读进度',
  },

  // 阅读器
  reader: {
    fontSize: '字体大小',
    lineHeight: '行距',
    theme: '主题',
    tts: '语音朗读',
    ttsPlay: '播放',
    ttsPause: '暂停',
    ttsStop: '停止',
    ttsSpeed: '语速',
    ttsVoice: '声音',
    prevPage: '上一页',
    nextPage: '下一页',
    pageOf: '第 {current} 页 / 共 {total} 页',
    jumpToPage: '跳转页面',
  },
};
