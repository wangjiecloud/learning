import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors, getThemeColors, Spacing, Radius, Typography } from '../../theme';
import type { Difficulty } from '../../types';
import i18n from '../../i18n';

interface Props {
  difficulty: Difficulty;
  size?: 'sm' | 'md';
}

export function DifficultyBadge({ difficulty, size = 'sm' }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = getThemeColors(scheme);

  const config = {
    junior: {
      label: i18n.t('difficulty.junior'),
      color: colors.junior,
      bg: colors.juniorBg,
    },
    senior: {
      label: i18n.t('difficulty.senior'),
      color: colors.senior,
      bg: colors.seniorBg,
    },
    expert: {
      label: i18n.t('difficulty.expert'),
      color: colors.expert,
      bg: colors.expertBg,
    },
  };

  const { label, color, bg } = config[difficulty];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: color,
          paddingHorizontal: isSmall ? Spacing.sm : Spacing.md,
          paddingVertical: isSmall ? 2 : 4,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color,
            fontSize: isSmall ? Typography.size.xs : Typography.size.sm,
            fontFamily: Typography.fontFamily.semiBold,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    letterSpacing: 0.3,
  },
});
