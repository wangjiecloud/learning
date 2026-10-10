import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Colors, getThemeColors, Spacing, Radius, Typography } from '../../theme';
import { useTts } from '../../hooks/useTts';
import i18n from '../../i18n';

interface TtsControlsProps {
  text: string;
}

const RATE_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export function TtsControls({ text }: TtsControlsProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = getThemeColors(scheme);
  const { state, currentIndex, totalSentences, currentText, rate, play, pause, resume, stop, setRate } = useTts();

  const handlePlayPause = useCallback(() => {
    if (state === 'idle') {
      play(text);
    } else if (state === 'speaking') {
      pause();
    } else if (state === 'paused') {
      resume();
    }
  }, [state, text, play, pause, resume]);

  const playIcon = state === 'speaking' ? '⏸' : state === 'paused' ? '▶' : '▶';
  const playLabel =
    state === 'speaking'
      ? i18n.t('reader.ttsPause')
      : state === 'paused'
      ? i18n.t('reader.ttsPlay')
      : i18n.t('reader.ttsPlay');

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* 当前朗读文本 */}
      {currentText ? (
        <View style={[styles.currentTextRow, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.speakingDot, { color: colors.primary }]}>🔊</Text>
          <Text
            style={[styles.currentText, { color: colors.primary }]}
            numberOfLines={2}
          >
            {currentText}
          </Text>
        </View>
      ) : null}

      {/* 进度 */}
      {totalSentences > 0 && (
        <View style={styles.progressRow}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.accent,
                  width: `${((currentIndex + 1) / totalSentences) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textTertiary }]}>
            {currentIndex + 1}/{totalSentences}
          </Text>
        </View>
      )}

      {/* 控制按钮行 */}
      <View style={styles.controls}>
        {/* 播放/暂停 */}
        <TouchableOpacity
          style={[styles.playBtn, { backgroundColor: colors.accent }]}
          onPress={handlePlayPause}
          activeOpacity={0.8}
        >
          <Text style={styles.playIcon}>{playIcon}</Text>
          <Text style={styles.playLabel}>{playLabel}</Text>
        </TouchableOpacity>

        {/* 停止 */}
        {state !== 'idle' && (
          <TouchableOpacity
            style={[styles.stopBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={stop}
            activeOpacity={0.7}
          >
            <Text style={[styles.stopIcon, { color: colors.textSecondary }]}>⏹</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 语速选择 */}
      <View style={styles.rateRow}>
        <Text style={[styles.rateLabel, { color: colors.textTertiary }]}>
          {i18n.t('reader.ttsSpeed')}:
        </Text>
        {RATE_OPTIONS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[
              styles.rateBtn,
              {
                backgroundColor: rate === r ? colors.accent : colors.surfaceElevated,
                borderColor: rate === r ? colors.accent : colors.border,
              },
            ]}
            onPress={() => setRate(r)}
          >
            <Text
              style={[
                styles.rateBtnText,
                { color: rate === r ? '#fff' : colors.textSecondary },
              ]}
            >
              {r}x
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  currentTextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  speakingDot: { fontSize: 14, marginTop: 1 },
  currentText: {
    flex: 1,
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * 1.5,
    fontStyle: 'italic',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: Typography.size.xs,
    minWidth: 40,
    textAlign: 'right',
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  playBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  playIcon: { fontSize: 18, color: '#fff' },
  playLabel: { fontSize: Typography.size.sm, color: '#fff', fontWeight: '600' },
  stopBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  stopIcon: { fontSize: 18 },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  rateLabel: { fontSize: Typography.size.xs, marginRight: Spacing.xs },
  rateBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  rateBtnText: { fontSize: Typography.size.xs, fontWeight: '600' },
});
