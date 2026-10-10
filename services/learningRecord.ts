/**
 * 学习状态服务
 * 管理题目的 5 种状态：unread / learning / reviewing / starred / mastered
 */
import { storage } from './storage';
import type { LearningRecord, QuestionStatus, QuestionModule, AppSettings, AppStats, ModuleStats } from '../types';

const RECORD_PREFIX = 'lr:';
const SETTINGS_KEY = 'app:settings';
const STREAK_KEY = 'app:streak';

// ── 学习记录 CRUD ─────────────────────────────────────────────

export async function getRecord(questionId: string): Promise<LearningRecord | undefined> {
  return storage.get<LearningRecord>(`${RECORD_PREFIX}${questionId}`);
}

export async function setStatus(questionId: string, status: QuestionStatus): Promise<LearningRecord> {
  const existing = await getRecord(questionId);
  const record: LearningRecord = {
    questionId,
    status,
    markedAt: Date.now(),
    viewCount: existing?.viewCount ?? 0,
    notes: existing?.notes,
  };
  await storage.set(`${RECORD_PREFIX}${questionId}`, record);
  await updateStreak();
  return record;
}

export async function incrementViewCount(questionId: string): Promise<void> {
  const existing = await getRecord(questionId);
  if (existing) {
    await storage.set(`${RECORD_PREFIX}${questionId}`, {
      ...existing,
      viewCount: existing.viewCount + 1,
      // 首次查看时从 unread → learning
      status: existing.status === 'unread' ? 'learning' : existing.status,
      markedAt: Date.now(),
    });
  } else {
    const record: LearningRecord = {
      questionId,
      status: 'learning',
      markedAt: Date.now(),
      viewCount: 1,
    };
    await storage.set(`${RECORD_PREFIX}${questionId}`, record);
  }
}

export async function getAllRecords(): Promise<LearningRecord[]> {
  return storage.getAll<LearningRecord>(RECORD_PREFIX);
}

export async function getRecordsByStatus(status: QuestionStatus): Promise<LearningRecord[]> {
  const all = await getAllRecords();
  return all.filter((r) => r.status === status);
}

// ── 批量获取状态 Map（用于列表页快速查状态）─────────────────────

export async function getStatusMap(): Promise<Map<string, QuestionStatus>> {
  const all = await getAllRecords();
  const map = new Map<string, QuestionStatus>();
  for (const record of all) {
    map.set(record.questionId, record.status);
  }
  return map;
}

// ── 统计 ──────────────────────────────────────────────────────

export async function computeModuleStats(
  questionIds: string[]
): Promise<ModuleStats> {
  const statusMap = await getStatusMap();
  const stats: ModuleStats = {
    total: questionIds.length,
    unread: 0,
    learning: 0,
    reviewing: 0,
    starred: 0,
    mastered: 0,
    masteredPercent: 0,
  };

  for (const id of questionIds) {
    const status = statusMap.get(id) ?? 'unread';
    stats[status]++;
  }
  stats.masteredPercent =
    stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

  return stats;
}

// ── App 设置 ──────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  const saved = await storage.get<AppSettings>(SETTINGS_KEY);
  return (
    saved ?? {
      locale: 'zh',
      colorScheme: 'system',
      readerSettings: {
        fontSize: 16,
        lineHeight: 1.6,
        theme: 'light',
        ttsRate: 1.0,
        ttsLanguage: 'zh-CN',
      },
      lastActiveTab: 'index',
    }
  );
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await storage.set(SETTINGS_KEY, settings);
}

export async function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> {
  const settings = await getSettings();
  settings[key] = value;
  await saveSettings(settings);
}

// ── 连续学习天数 ──────────────────────────────────────────────

interface StreakData {
  streakDays: number;
  lastStudyDate: string;  // YYYY-MM-DD
}

export async function updateStreak(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const data = await storage.get<StreakData>(STREAK_KEY);

  if (!data) {
    await storage.set(STREAK_KEY, { streakDays: 1, lastStudyDate: today });
    return;
  }

  const last = data.lastStudyDate;
  if (last === today) return; // 今天已记录

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newStreak = last === yesterday ? data.streakDays + 1 : 1;
  await storage.set(STREAK_KEY, { streakDays: newStreak, lastStudyDate: today });
}

export async function getStreak(): Promise<StreakData> {
  return (await storage.get<StreakData>(STREAK_KEY)) ?? { streakDays: 0, lastStudyDate: '' };
}
