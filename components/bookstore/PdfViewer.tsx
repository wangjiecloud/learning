import React from 'react';
import { View, StyleSheet } from 'react-native';

interface PdfViewerProps {
  uri: string;       // Web: Blob URL
  style?: object;
}

/**
 * Web 平台 PDF 阅读器
 * 使用浏览器内置 iframe 渲染
 */
export function PdfViewer({ uri, style }: PdfViewerProps) {
  return (
    <View style={[styles.container, style]}>
      {/* @ts-ignore - iframe 是 Web 专有元素 */}
      <iframe
        src={uri}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="PDF Viewer"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});
