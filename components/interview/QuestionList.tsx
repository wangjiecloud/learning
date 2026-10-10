import React, { useCallback } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { QuestionCard } from './QuestionCard';
import { StatusTabs } from './StatusTabs';
import { SearchBar } from '../common/SearchBar';
import { Colors, getThemeColors, Spacing, Typography } from '../../theme';
import { useQuestions } from '../../hooks/useQuestions';
import type { Question, QuestionModule, QuestionStatus } from '../../types';
import i18n from '../../i18n';

interface QuestionListProps {
  module: QuestionModule;
  headerComponent?: React.ReactElement;
}

export function QuestionList({ module, headerComponent }: QuestionListProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = getThemeColors(scheme);

  const {
    questions,
    loading,
    filters,
    setFilters,
    statusCounts,
    markStatus,
    viewQuestion,
    getQuestionStatus,
  } = useQuestions(module);

  const handleStatusChange = useCallback(
    (questionId: string, status: QuestionStatus) => {
      markStatus(questionId, status);
    },
    [markStatus]
  );

  const handleView = useCallback(
    (questionId: string) => {
      viewQuestion(questionId);
    },
    [viewQuestion]
  );

  const renderItem = useCallback(
    ({ item }: { item: Question }) => (
      <QuestionCard
        question={item}
        status={getQuestionStatus(item.id)}
        onStatusChange={handleStatusChange}
        onView={handleView}
      />
    ),
    [getQuestionStatus, handleStatusChange, handleView]
  );

  const keyExtractor = useCallback((item: Question) => item.id, []);

  const ListHeader = (
    <View>
      {headerComponent}
      <SearchBar
        value={filters.searchText}
        onChangeText={(text) => setFilters((prev) => ({ ...prev, searchText: text }))}
      />
      <StatusTabs
        activeTab={filters.status}
        counts={statusCounts}
        onChange={(tab) => setFilters((prev) => ({ ...prev, status: tab }))}
      />
    </View>
  );

  const ListEmpty = (
    <View style={styles.empty}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            {i18n.t('questions.noResults')}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <FlatList
      data={questions}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={ListEmpty}
      contentContainerStyle={[
        styles.list,
        { backgroundColor: colors.background },
        questions.length === 0 && styles.listEmpty,
      ]}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['3xl'],
  },
  listEmpty: {
    flexGrow: 1,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing['4xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.size.base,
    textAlign: 'center',
  },
});
