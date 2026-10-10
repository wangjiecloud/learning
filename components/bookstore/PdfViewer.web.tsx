import React from 'react';
import { View } from 'react-native';

interface PdfViewerProps {
  uri: string;
  style?: object;
}

/**
 * Web 平台 PDF 阅读器
 * 使用浏览器内置 PDF 渲染（iframe）
 */
export function PdfViewer({ uri, style }: PdfViewerProps) {
  return (
    <View style={[{ flex: 1, width: '100%' }, style]}>
      {/* @ts-ignore - iframe is web-only */}
      <iframe
        src={uri}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="PDF Viewer"
      />
    </View>
  );
}
