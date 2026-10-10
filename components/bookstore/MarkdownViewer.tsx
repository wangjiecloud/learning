import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, useColorScheme } from 'react-native';
import { getThemeColors, Spacing, Typography } from '../../theme';

interface MarkdownViewerProps {
  content: string;
  fontSize?: number;
  lineHeight?: number;
  onProgressChange?: (position: number, percentage: number) => void;
  initialPosition?: number;
}

/**
 * Markdown 阅读器
 * Web: 用 marked 解析成 HTML，通过 dangerouslySetInnerHTML 渲染（原生 DOM）
 * Android: 显示原始 Markdown 文本（无渲染，降级方案）
 */
export function MarkdownViewer({
  content,
  fontSize = 16,
  lineHeight = 1.7,
}: MarkdownViewerProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = getThemeColors(scheme);
  const isDark = scheme === 'dark';

  if (Platform.OS === 'web') {
    return (
      <WebMarkdownViewer
        content={content}
        fontSize={fontSize}
        lineHeight={lineHeight}
        isDark={isDark}
      />
    );
  }

  // Android 降级：纯文本显示
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.textContent}
    >
      <Text
        style={[
          styles.rawText,
          {
            color: colors.text,
            fontSize,
            lineHeight: fontSize * lineHeight,
            fontFamily: Typography.fontFamily.regular,
          },
        ]}
        selectable
      >
        {content}
      </Text>
    </ScrollView>
  );
}

// Web 端专用组件（内联，避免 .web.tsx 文件分支复杂度）
function WebMarkdownViewer({
  content,
  fontSize,
  lineHeight,
  isDark,
}: {
  content: string;
  fontSize: number;
  lineHeight: number;
  isDark: boolean;
}) {
  const html = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { marked } = require('marked');
      return marked(content) as string;
    } catch {
      // fallback：原始文本包在 pre 标签
      return `<pre style="white-space:pre-wrap">${content.replace(/</g, '&lt;')}</pre>`;
    }
  }, [content]);

  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const codeBackground = isDark ? '#2d3748' : '#f7fafc';
  const codeBorder = isDark ? '#4a5568' : '#e2e8f0';
  const blockquoteBorder = isDark ? '#6366f1' : '#818cf8';
  const blockquoteBackground = isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)';
  const hrColor = isDark ? '#4a5568' : '#e2e8f0';
  const linkColor = isDark ? '#818cf8' : '#4f46e5';
  const tableHeaderBackground = isDark ? '#374151' : '#f3f4f6';
  const tableBorder = isDark ? '#4b5563' : '#e5e7eb';

  const cssString = `
    body {
      margin: 0;
      padding: ${Spacing.xl}px;
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
      color: ${textColor};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      word-wrap: break-word;
    }
    h1, h2, h3, h4, h5, h6 {
      margin: 1.2em 0 0.5em;
      font-weight: 700;
      line-height: 1.3;
      color: ${textColor};
    }
    h1 { font-size: ${fontSize * 1.8}px; }
    h2 { font-size: ${fontSize * 1.5}px; border-bottom: 2px solid ${hrColor}; padding-bottom: 0.3em; }
    h3 { font-size: ${fontSize * 1.25}px; }
    p { margin: 0.8em 0; }
    code {
      background: ${codeBackground};
      border: 1px solid ${codeBorder};
      border-radius: 4px;
      padding: 0.15em 0.4em;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 0.9em;
    }
    pre {
      background: ${codeBackground};
      border: 1px solid ${codeBorder};
      border-radius: 8px;
      padding: 1em;
      overflow-x: auto;
      margin: 1em 0;
    }
    pre code {
      background: none;
      border: none;
      padding: 0;
      font-size: ${fontSize * 0.875}px;
    }
    blockquote {
      border-left: 4px solid ${blockquoteBorder};
      background: ${blockquoteBackground};
      margin: 1em 0;
      padding: 0.5em 1em;
      border-radius: 0 6px 6px 0;
    }
    blockquote p { margin: 0.3em 0; }
    ul, ol { padding-left: 1.5em; margin: 0.8em 0; }
    li { margin: 0.3em 0; }
    hr { border: none; border-top: 1px solid ${hrColor}; margin: 1.5em 0; }
    a { color: ${linkColor}; text-decoration: none; }
    a:hover { text-decoration: underline; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid ${tableBorder}; padding: 0.5em 0.8em; text-align: left; }
    th { background: ${tableHeaderBackground}; font-weight: 600; }
    img { max-width: 100%; height: auto; border-radius: 6px; }
    strong { font-weight: 700; }
    em { font-style: italic; }
  `;

  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${cssString}</style></head><body>${html}</body></html>`;

  return (
    <View style={styles.webContainer}>
      {/* @ts-ignore - iframe 是 Web 专有元素 */}
      <iframe
        srcDoc={fullHtml}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: 'transparent',
        }}
        title="Markdown Viewer"
        sandbox="allow-same-origin"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  textContent: { padding: Spacing.xl },
  rawText: {
    textAlign: 'left',
  },
  webContainer: {
    flex: 1,
    width: '100%',
  },
});
