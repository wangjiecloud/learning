import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Question, QuestionStatus, QuestionModule, Difficulty, QuestionCategory } from '../types';
import { getStatusMap, setStatus, incrementViewCount } from '../services/learningRecord';
import i18n from '../i18n';

// 动态加载题库 JSON（懒加载，避免首屏阻塞）
async function loadQuestions(module: QuestionModule): Promise<Question[]> {
  if (module === 'architect') {
    const data = await import('../data/architect-questions.json');
    return data.default as Question[];
  } else {
    const data = await import('../data/agent-questions.json');
    return data.default as Question[];
  }
}

export interface QuestionFilters {
  status: QuestionStatus | 'all';
  difficulty: Difficulty | 'all';
  category: QuestionCategory | 'all';
  searchText: string;
}

export function useQuestions(module: QuestionModule) {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [statusMap, setStatusMap] = useState<Map<string, QuestionStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<QuestionFilters>({
    status: 'all',
    difficulty: 'all',
    category: 'all',
    searchText: '',
  });

  // 加载题库和状态
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [questions, map] = await Promise.all([
          loadQuestions(module),
          getStatusMap(),
        ]);
        if (!cancelled) {
          setAllQuestions(questions);
          setStatusMap(map);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [module]);

  // 刷新状态 Map（标记操作后调用）
  const refreshStatusMap = useCallback(async () => {
    const map = await getStatusMap();
    setStatusMap(map);
  }, []);

  // 标记状态
  const markStatus = useCallback(async (questionId: string, status: QuestionStatus) => {
    await setStatus(questionId, status);
    await refreshStatusMap();
  }, [refreshStatusMap]);

  // 查看题目（自动增加查看次数，unread → learning）
  const viewQuestion = useCallback(async (questionId: string) => {
    await incrementViewCount(questionId);
    await refreshStatusMap();
  }, [refreshStatusMap]);

  // 获取单题状态
  const getQuestionStatus = useCallback((questionId: string): QuestionStatus => {
    return statusMap.get(questionId) ?? 'unread';
  }, [statusMap]);

  // 过滤后的题目列表
  const filteredQuestions = useMemo(() => {
    const locale = i18n.locale as 'zh' | 'en';

    return allQuestions.filter((q) => {
      // 状态过滤（默认主列表隐藏 mastered）
      const qStatus = statusMap.get(q.id) ?? 'unread';
      if (filters.status === 'all') {
        // 主列表：显示非 mastered 的题目
        if (qStatus === 'mastered') return false;
      } else {
        if (qStatus !== filters.status) return false;
      }

      // 难度过滤
      if (filters.difficulty !== 'all' && q.difficulty !== filters.difficulty) return false;

      // 分类过滤
      if (filters.category !== 'all' && q.category !== filters.category) return false;

      // 搜索过滤
      if (filters.searchText.trim()) {
        const keyword = filters.searchText.toLowerCase();
        const titleZh = q.title.toLowerCase();
        const titleEn = (q.titleEn ?? '').toLowerCase();
        const title = locale === 'zh' ? titleZh : titleEn || titleZh;
        if (!title.includes(keyword) && !q.tags.some((t) => t.toLowerCase().includes(keyword))) {
          return false;
        }
      }

      return true;
    });
  }, [allQuestions, statusMap, filters]);

  // 统计各状态数量（包含 mastered）
  const statusCounts = useMemo(() => {
    const counts = { unread: 0, learning: 0, reviewing: 0, starred: 0, mastered: 0, all: 0 };
    for (const q of allQuestions) {
      const s = statusMap.get(q.id) ?? 'unread';
      counts[s]++;
      counts.all++;
    }
    return counts;
  }, [allQuestions, statusMap]);

  // 分类列表（去重）
  const categories = useMemo(() => {
    const cats = new Set<QuestionCategory>();
    allQuestions.forEach((q) => cats.add(q.category));
    return Array.from(cats);
  }, [allQuestions]);

  return {
    questions: filteredQuestions,
    allQuestions,
    loading,
    filters,
    setFilters,
    statusCounts,
    categories,
    markStatus,
    viewQuestion,
    getQuestionStatus,
    refreshStatusMap,
  };
}
