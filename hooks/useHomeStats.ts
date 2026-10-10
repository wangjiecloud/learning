import { useState, useEffect, useCallback } from 'react';
import type { ModuleStats } from '../types';
import { computeModuleStats, getStreak, getAllRecords } from '../services/learningRecord';

interface HomeStats {
  architect: ModuleStats;
  agent: ModuleStats;
  streak: number;
  totalBooks: number;
  statusCounts: {
    unread: number;
    learning: number;
    reviewing: number;
    starred: number;
    mastered: number;
  };
}

const DEFAULT_MODULE_STATS: ModuleStats = {
  total: 0,
  unread: 0,
  learning: 0,
  reviewing: 0,
  starred: 0,
  mastered: 0,
  masteredPercent: 0,
};

export function useHomeStats() {
  const [stats, setStats] = useState<HomeStats>({
    architect: DEFAULT_MODULE_STATS,
    agent: DEFAULT_MODULE_STATS,
    streak: 0,
    totalBooks: 0,
    statusCounts: { unread: 0, learning: 0, reviewing: 0, starred: 0, mastered: 0 },
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // 并行加载题库 ID 列表和 streak
      const [architectData, agentData, streakData, allRecords] = await Promise.all([
        import('../data/architect-questions.json').then((m) => m.default),
        import('../data/agent-questions.json').then((m) => m.default),
        getStreak(),
        getAllRecords(),
      ]);

      const architectIds = (architectData as Array<{ id: string }>).map((q) => q.id);
      const agentIds = (agentData as Array<{ id: string }>).map((q) => q.id);

      const [architectStats, agentStats] = await Promise.all([
        computeModuleStats(architectIds),
        computeModuleStats(agentIds),
      ]);

      // 全局状态统计（跨模块合并）
      const statusCounts = { unread: 0, learning: 0, reviewing: 0, starred: 0, mastered: 0 };
      const allIds = new Set([...architectIds, ...agentIds]);

      // 从 allRecords 统计有记录的题目
      for (const record of allRecords) {
        if (allIds.has(record.questionId) && record.status in statusCounts) {
          statusCounts[record.status as keyof typeof statusCounts]++;
        }
      }
      // 无记录的题目算 unread
      const recordedIds = new Set(allRecords.map((r) => r.questionId));
      for (const id of allIds) {
        if (!recordedIds.has(id)) statusCounts.unread++;
      }

      // 书籍数量（从 storage keys 统计）
      const { storage } = await import('../services/storage');
      const keys = await storage.keys();
      const totalBooks = keys.filter((k) => k.startsWith('book:')).length;

      setStats({
        architect: architectStats,
        agent: agentStats,
        streak: streakData.streakDays,
        totalBooks,
        statusCounts,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, refresh };
}
