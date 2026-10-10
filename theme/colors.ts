// 颜色系统 - 支持明/暗双主题
export const Colors = {
  light: {
    // 背景层次
    background: '#f8f9ff',
    surface: '#ffffff',
    surfaceElevated: '#f0f1ff',
    border: '#e2e3f0',
    borderLight: '#eef0ff',

    // 文字层次
    text: '#0f0f23',
    textSecondary: '#4b4d6b',
    textTertiary: '#8b8daa',
    textInverse: '#ffffff',

    // 主色 - 架构师模块
    primary: '#6366f1',
    primaryLight: '#eef2ff',
    primaryMid: '#c7d2fe',

    // 副色 - Agent 模块
    secondary: '#8b5cf6',
    secondaryLight: '#f3f0ff',
    secondaryMid: '#ddd6fe',

    // 书城
    accent: '#0ea5e9',
    accentLight: '#e0f7ff',

    // 难度色
    junior: '#22c55e',
    juniorBg: '#f0fdf4',
    senior: '#f59e0b',
    seniorBg: '#fffbeb',
    expert: '#ef4444',
    expertBg: '#fef2f2',

    // 状态色
    learning: '#3b82f6',
    learningBg: '#eff6ff',
    reviewing: '#f97316',
    reviewingBg: '#fff7ed',
    starred: '#eab308',
    starredBg: '#fefce8',
    mastered: '#10b981',
    masteredBg: '#ecfdf5',

    // 功能色
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    // 阴影
    shadow: 'rgba(99, 102, 241, 0.08)',
    shadowMd: 'rgba(99, 102, 241, 0.12)',
  },
  dark: {
    background: '#0a0a1a',
    surface: '#12122a',
    surfaceElevated: '#1a1a35',
    border: '#2a2a4a',
    borderLight: '#1e1e3a',

    text: '#f0f0ff',
    textSecondary: '#a0a2c0',
    textTertiary: '#6062808',
    textInverse: '#0f0f23',

    primary: '#818cf8',
    primaryLight: '#1e1f3a',
    primaryMid: '#3730a3',

    secondary: '#a78bfa',
    secondaryLight: '#1e1a35',
    secondaryMid: '#4c1d95',

    accent: '#38bdf8',
    accentLight: '#0c1a2e',

    junior: '#4ade80',
    juniorBg: '#052e16',
    senior: '#fbbf24',
    seniorBg: '#1c0f00',
    expert: '#f87171',
    expertBg: '#1a0a0a',

    learning: '#60a5fa',
    learningBg: '#0f1c35',
    reviewing: '#fb923c',
    reviewingBg: '#1c0c00',
    starred: '#facc15',
    starredBg: '#1a1500',
    mastered: '#34d399',
    masteredBg: '#012015',

    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',

    shadow: 'rgba(0, 0, 0, 0.4)',
    shadowMd: 'rgba(0, 0, 0, 0.6)',
  },
};

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof Colors.light;

/** 安全获取主题色，防止 useColorScheme 返回 null 或 'unspecified' */
export function getThemeColors(scheme: string | null | undefined): ThemeColors {
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}
