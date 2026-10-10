import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
} from 'react-native';
import { Colors, getThemeColors, Spacing, Radius, Shadow, Typography } from '../../theme';
import { DifficultyBadge } from './DifficultyBadge';
import { MarkdownContent } from './MarkdownContent';
import { AnimatedDiagram } from './AnimatedDiagram';
import { DIAGRAMS } from '../../data/diagrams';
import type { Question, QuestionStatus } from '../../types';
import i18n from '../../i18n';

// Android 需要手动启用 LayoutAnimation
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  question: Question;
  status: QuestionStatus;
  onStatusChange: (questionId: string, status: QuestionStatus) => void;
  onView: (questionId: string) => void;
}

const STATUS_ICONS: Record<QuestionStatus, string> = {
  unread: '○',
  learning: '◐',
  reviewing: '↺',
  starred: '★',
  mastered: '✓',
};

export function QuestionCard({ question, status, onStatusChange, onView }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = getThemeColors(scheme);
  const [expanded, setExpanded] = useState(false);
  const locale = i18n.locale as 'zh' | 'en';

  const title = locale === 'en' && question.titleEn ? question.titleEn : question.title;
  const shortAnswer =
    locale === 'en' && question.shortAnswerEn ? question.shortAnswerEn : question.shortAnswer;
  const detailedAnswer =
    locale === 'en' && question.detailedAnswerEn
      ? question.detailedAnswerEn
      : question.detailedAnswer;

  const handleToggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
    if (!expanded) {
      onView(question.id);
    }
  }, [expanded, question.id, onView]);

  // 状态按钮配置
  const statusButtons: { status: QuestionStatus; icon: string; activeColor: string }[] = [
    { status: 'starred', icon: '★', activeColor: colors.starred },
    { status: 'reviewing', icon: '↺', activeColor: colors.reviewing },
    { status: 'mastered', icon: '✓', activeColor: colors.mastered },
  ];

  const handleStatusToggle = useCallback(
    (targetStatus: QuestionStatus) => {
      // 同一状态再点则取消（回到 learning）
      const newStatus = status === targetStatus ? 'learning' : targetStatus;
      onStatusChange(question.id, newStatus);
    },
    [status, question.id, onStatusChange]
  );

  // 卡片左边框颜色
  const borderColor =
    status === 'mastered'
      ? colors.mastered
      : status === 'starred'
      ? colors.starred
      : status === 'reviewing'
      ? colors.reviewing
      : status === 'learning'
      ? colors.learning
      : colors.border;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderLeftColor: borderColor,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {/* 题目头部 */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={styles.headerTop}>
          <DifficultyBadge difficulty={question.difficulty} />
          <View style={styles.statusIndicator}>
            <Text style={[styles.statusIcon, { color: borderColor }]}>
              {STATUS_ICONS[status]}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontFamily: Typography.fontFamily.semiBold,
            },
          ]}
          numberOfLines={expanded ? undefined : 2}
        >
          {title}
        </Text>

        {/* 标签行 */}
        <View style={styles.tags}>
          {question.tags.slice(0, 3).map((tag) => (
            <View
              key={tag}
              style={[styles.tag, { backgroundColor: colors.primaryLight }]}
            >
              <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* 展开/收起指示器 */}
        <View style={styles.expandHint}>
          <Text style={[styles.expandText, { color: colors.textTertiary }]}>
            {expanded ? i18n.t('questions.collapseAnswer') : i18n.t('questions.expandAnswer')}
          </Text>
          <Text style={[styles.expandArrow, { color: colors.textTertiary }]}>
            {expanded ? '▲' : '▼'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 展开内容 */}
      {expanded && (
        <View style={styles.body}>
          {/* 分隔线 */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* 简短答案 */}
          <View style={[styles.section, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>
              💡 {i18n.t('questions.answer')}
            </Text>
            <Text style={[styles.sectionContent, { color: colors.text }]}>
              {shortAnswer}
            </Text>
          </View>

          {/* 动画步骤图（内置题专属）*/}
          {question.diagramId && DIAGRAMS[question.diagramId] ? (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                🎬 交互式流程图
              </Text>
              <AnimatedDiagram data={DIAGRAMS[question.diagramId]} />
            </View>
          ) : null}

          {/* 详细解析 */}
          {detailedAnswer ? (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                📖 {i18n.t('questions.analysis')}
              </Text>
              <MarkdownContent content={detailedAnswer} fontSize={13} />
            </View>
          ) : null}

          {/* 代码示例 */}
          {question.codeExamples.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {'</>'}  {i18n.t('questions.examples')}
              </Text>
              {question.codeExamples.map((ex, idx) => (
                <View
                  key={idx}
                  style={[styles.codeBlock, { backgroundColor: colors.surfaceElevated }]}
                >
                  {ex.description ? (
                    <Text style={[styles.codeDesc, { color: colors.textTertiary }]}>
                      {ex.description}
                    </Text>
                  ) : null}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Text
                      style={[
                        styles.code,
                        { color: colors.text, fontFamily: 'monospace' },
                      ]}
                    >
                      {ex.code}
                    </Text>
                  </ScrollView>
                </View>
              ))}
            </View>
          )}

          {/* 知识要点 */}
          {question.keyPoints.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                🔑 {i18n.t('questions.keyPoints')}
              </Text>
              {question.keyPoints.map((point, idx) => (
                <View key={idx} style={styles.keyPointRow}>
                  <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.keyPointText, { color: colors.text }]}>
                    {point}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* 状态操作按钮 */}
          <View style={styles.actions}>
            {statusButtons.map(({ status: btnStatus, icon, activeColor }) => {
              const isActive = status === btnStatus;
              return (
                <TouchableOpacity
                  key={btnStatus}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: isActive ? activeColor + '20' : colors.surfaceElevated,
                      borderColor: isActive ? activeColor : colors.border,
                    },
                  ]}
                  onPress={() => handleStatusToggle(btnStatus)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionIcon, { color: isActive ? activeColor : colors.textTertiary }]}>
                    {icon}
                  </Text>
                  <Text
                    style={[
                      styles.actionLabel,
                      { color: isActive ? activeColor : colors.textTertiary },
                    ]}
                  >
                    {i18n.t(`questions.${isActive ? 'unmark' : 'mark'}${btnStatus.charAt(0).toUpperCase() + btnStatus.slice(1)}` as any)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderLeftWidth: 4,
    marginBottom: Spacing.md,
    ...Shadow.md,
    overflow: 'hidden',
  },
  header: {
    padding: Spacing.base,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: Typography.size.md,
    lineHeight: Typography.size.md * 1.5,
    marginBottom: Spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  tagText: {
    fontSize: Typography.size.xs,
    fontWeight: '500',
  },
  expandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  expandText: {
    fontSize: Typography.size.xs,
  },
  expandArrow: {
    fontSize: Typography.size.xs,
  },
  body: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
  divider: {
    height: 1,
    marginBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  sectionLabel: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
  },
  sectionContent: {
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * 1.6,
  },
  detailText: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * 1.75,
  },
  codeBlock: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  codeDesc: {
    fontSize: Typography.size.xs,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },
  code: {
    fontSize: 12,
    lineHeight: 20,
  },
  keyPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  keyPointText: {
    flex: 1,
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * 1.6,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  actionIcon: {
    fontSize: Typography.size.base,
  },
  actionLabel: {
    fontSize: Typography.size.xs,
    fontWeight: '500',
  },
});
