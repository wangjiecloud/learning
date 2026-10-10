import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { Colors, getThemeColors, Spacing, Radius, Typography } from '../../theme';
import { TtsControls } from './TtsControls';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CHARS_PER_PAGE = 800; // 每页约 800 字符

interface TxtViewerProps {
  content: string;
  fontSize?: number;
  lineHeight?: number;
  onProgressChange?: (position: number, percentage: number) => void;
  initialPosition?: number;
}

export function TxtViewer({
  content,
  fontSize = 16,
  lineHeight = 1.7,
  onProgressChange,
  initialPosition = 0,
}: TxtViewerProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = getThemeColors(scheme);

  const [showTts, setShowTts] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // 将文本分页
  const pages = React.useMemo(() => {
    const result: string[] = [];
    for (let i = 0; i < content.length; i += CHARS_PER_PAGE) {
      result.push(content.slice(i, i + CHARS_PER_PAGE));
    }
    return result.length > 0 ? result : [''];
  }, [content]);

  const totalPages = pages.length;

  // 从 initialPosition 计算初始页
  useEffect(() => {
    if (initialPosition > 0) {
      const page = Math.floor(initialPosition / CHARS_PER_PAGE);
      setCurrentPage(Math.min(page, totalPages - 1));
    }
  }, [initialPosition, totalPages]);

  const handlePageChange = useCallback(
    (page: number) => {
      const clamped = Math.max(0, Math.min(page, totalPages - 1));
      setCurrentPage(clamped);
      const position = clamped * CHARS_PER_PAGE;
      const percentage = Math.round((position / content.length) * 100);
      onProgressChange?.(position, percentage);
    },
    [totalPages, content.length, onProgressChange]
  );

  const currentText = pages[currentPage] ?? '';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 阅读区域 */}
      <View style={styles.readerArea}>
        <Text
          style={[
            styles.content,
            {
              color: colors.text,
              fontSize,
              lineHeight: fontSize * lineHeight,
              fontFamily: Typography.fontFamily.regular,
            },
          ]}
          selectable
        >
          {currentText}
        </Text>
      </View>

      {/* 底部控制 */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* 翻页控制 */}
        <View style={styles.pageControls}>
          <TouchableOpacity
            style={[
              styles.pageBtn,
              {
                backgroundColor: currentPage === 0 ? colors.surfaceElevated : colors.primary,
                opacity: currentPage === 0 ? 0.4 : 1,
              },
            ]}
            onPress={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            <Text style={[styles.pageBtnText, { color: currentPage === 0 ? colors.textTertiary : '#fff' }]}>
              ‹ 上页
            </Text>
          </TouchableOpacity>

          <Text style={[styles.pageInfo, { color: colors.textSecondary }]}>
            {currentPage + 1} / {totalPages}
          </Text>

          <TouchableOpacity
            style={[
              styles.pageBtn,
              {
                backgroundColor: currentPage === totalPages - 1 ? colors.surfaceElevated : colors.primary,
                opacity: currentPage === totalPages - 1 ? 0.4 : 1,
              },
            ]}
            onPress={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
          >
            <Text style={[styles.pageBtnText, { color: currentPage === totalPages - 1 ? colors.textTertiary : '#fff' }]}>
              下页 ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* 进度条 */}
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.accent,
                width: `${((currentPage + 1) / totalPages) * 100}%`,
              },
            ]}
          />
        </View>

        {/* TTS 切换按钮 */}
        <TouchableOpacity
          style={[styles.ttsToggle, { backgroundColor: colors.accentLight }]}
          onPress={() => setShowTts((v) => !v)}
        >
          <Text style={[styles.ttsToggleText, { color: colors.accent }]}>
            🔊 {showTts ? '关闭朗读' : '语音朗读'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* TTS 控制面板 */}
      {showTts && <TtsControls text={currentText} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  readerArea: {
    flex: 1,
    padding: Spacing.xl,
  },
  content: {
    textAlign: 'justify',
  },
  footer: {
    borderTopWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  pageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  pageBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
  },
  pageInfo: {
    fontSize: Typography.size.sm,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  ttsToggle: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  ttsToggleText: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
  },
});
