// ============================================================
// 题目相关类型
// ============================================================

export type Difficulty = 'junior' | 'senior' | 'expert';

export type QuestionStatus = 'unread' | 'learning' | 'reviewing' | 'starred' | 'mastered';

export type QuestionModule = 'architect' | 'agent';

export type ArchitectCategory =
  | 'systemDesign'
  | 'designPatterns'
  | 'distributed'
  | 'performance'
  | 'microservice'
  | 'ddd'
  | 'cloud'
  | 'database'
  | 'security'
  | 'other';

export type AgentCategory =
  | 'llmBasic'
  | 'agentFramework'
  | 'rag'
  | 'promptEngineering'
  | 'multiAgent'
  | 'evaluation'
  | 'engineering'
  | 'tools'
  | 'memory'
  | 'other';

export type QuestionCategory = ArchitectCategory | AgentCategory;

export interface CodeExample {
  language: string;  // 'python' | 'java' | 'typescript' | 'bash' | 'sql' | ...
  code: string;
  description?: string;
}

export interface Question {
  id: string;                    // 唯一 ID: ${source}_${titleHash}
  module: QuestionModule;        // 所属模块
  category: QuestionCategory;    // 分类
  difficulty: Difficulty;        // 难度
  title: string;                 // 题目标题
  titleEn?: string;              // 英文标题（可选）
  shortAnswer: string;           // 简短答案（列表展示用）
  shortAnswerEn?: string;        // 英文简短答案
  detailedAnswer: string;        // 详细解析（Markdown）
  detailedAnswerEn?: string;     // 英文详细解析
  codeExamples: CodeExample[];   // 代码示例
  keyPoints: string[];           // 知识要点
  keyPointsEn?: string[];
  tags: string[];                // 标签
  source: string;                // 来源（如 'github/system-design-primer'）
  sourceUrl?: string;            // 原文链接
  lang: 'zh' | 'en' | 'both';   // 内容语言
  quality: number;               // 质量分 0-100
  diagramId?: string;            // 关联动画步骤图 ID（内置题专属）
  createdAt: number;             // 时间戳
}

// ============================================================
// 学习记录类型
// ============================================================

export interface LearningRecord {
  questionId: string;
  status: QuestionStatus;
  markedAt: number;              // 最后修改时间戳
  viewCount: number;             // 查看次数
  notes?: string;                // 个人笔记（预留）
}

// ============================================================
// 书城相关类型
// ============================================================

export type BookFormat = 'txt' | 'pdf' | 'md';

export interface Book {
  id: string;
  title: string;
  format: BookFormat;
  size: number;                  // 字节数
  uploadTime: number;
  lastReadTime?: number;
  coverColor?: string;           // 随机封面色
}

export interface ReadingProgress {
  bookId: string;
  position: number;              // TXT: 字符偏移; PDF: 页码(1-based); MD: 字符偏移
  totalLength: number;           // TXT/MD: 总字符数; PDF: 总页数
  percentage: number;            // 0-100
  lastReadAt: number;
}

export interface ReaderSettings {
  fontSize: number;              // 14-24
  lineHeight: number;            // 1.4-2.0
  theme: 'light' | 'dark' | 'sepia';
  ttsRate: number;               // 0.5-2.0
  ttsLanguage: string;           // 'zh-CN' | 'en-US' | ...
}

// ============================================================
// TTS 状态类型
// ============================================================

export type TtsState = 'idle' | 'speaking' | 'paused';

export interface TtsProgress {
  state: TtsState;
  currentSentenceIndex: number;
  totalSentences: number;
  currentText: string;
}

// ============================================================
// App 全局设置
// ============================================================

export interface AppSettings {
  locale: 'zh' | 'en';
  colorScheme: 'light' | 'dark' | 'system';
  readerSettings: ReaderSettings;
  lastActiveTab: string;
}

// ============================================================
// 统计类型
// ============================================================

export interface ModuleStats {
  total: number;
  unread: number;
  learning: number;
  reviewing: number;
  starred: number;
  mastered: number;
  masteredPercent: number;
}

export interface AppStats {
  architect: ModuleStats;
  agent: ModuleStats;
  totalBooks: number;
  streakDays: number;
  lastStudyDate: string;         // YYYY-MM-DD
}
