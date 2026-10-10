import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Colors, getThemeColors, Spacing, Radius, Typography } from '../../theme';
import type { QuestionStatus } from '../../types';
import i18n from '../../i18n';

type TabKey = QuestionStatus | 'all';

interface StatusTabsProps {
  activeTab: TabKey;
  counts: Record<TabKey, number>;
  onChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; i18nKey: string; emoji: string }[] = [
  { key: 'all',       i18nKey: 'statusTabs.all',       emoji: '📚' },
  { key: 'unread',    i18nKey: 'statusTabs.unread',     emoji: '○' },
  { key: 'learning',  i18nKey: 'statusTabs.learning',   emoji: '◐' },
  { key: 'reviewing', i18nKey: 'statusTabs.reviewing',  emoji: '↺' },
  { key: 'starred',   i18nKey: 'statusTabs.starred',    emoji: '★' },
  { key: 'mastered',  i18nKey: 'statusTabs.mastered',   emoji: '✓' },
];

export function StatusTabs({ activeTab, counts, onChange }: StatusTabsProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = getThemeColors(scheme);

  const getActiveColor = (key: TabKey): string => {
    switch (key) {
      case 'learning':  return colors.learning;
      case 'reviewing': return colors.reviewing;
      case 'starred':   return colors.starred;
      case 'mastered':  return colors.mastered;
      default:          return colors.primary;
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {TABS.map(({ key, i18nKey, emoji }) => {
        const isActive = activeTab === key;
        const activeColor = getActiveColor(key);
        const count = counts[key] ?? 0;

        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.tab,
              {
                backgroundColor: isActive ? activeColor + '18' : colors.surfaceElevated,
                borderColor: isActive ? activeColor : 'transparent',
              },
            ]}
            onPress={() => onChange(key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.emoji, { opacity: isActive ? 1 : 0.5 }]}>{emoji}</Text>
            <Text
              style={[
                styles.label,
                { color: isActive ? activeColor : colors.textSecondary },
              ]}
            >
              {i18n.t(i18nKey)}
            </Text>
            {count > 0 && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: isActive ? activeColor : colors.textTertiary },
                ]}
              >
                <Text style={styles.badgeText}>{count > 999 ? '999+' : count}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  emoji: {
    fontSize: 13,
  },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
});
