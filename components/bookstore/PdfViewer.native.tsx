import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PdfViewerProps {
  uri: string;       // Android: file:// path
  style?: object;
}

/**
 * Android 平台 PDF 阅读器
 * 使用 react-native-pdf（需要 Development Build，不支持 Expo Go）
 */
export function PdfViewer({ uri, style }: PdfViewerProps) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Pdf = require('react-native-pdf').default;
    return (
      <Pdf
        source={{ uri, cache: true }}
        style={[styles.container, style]}
        onError={(error: Error) => console.warn('PDF Error:', error)}
      />
    );
  } catch {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>
          PDF 预览需要 Development Build{'\n'}
          请运行 expo run:android 或 EAS Build
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fallbackText: {
    textAlign: 'center',
    color: '#888',
    lineHeight: 24,
  },
});
