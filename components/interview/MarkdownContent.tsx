import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  useColorScheme,
} from 'react-native';
import { getThemeColors, Spacing, Radius, Typography } from '../../theme';

interface Props {
  content: string;
  /** 字体大小，默认 13 */
  fontSize?: number;
}

// ─── Web 端：iframe srcDoc 渲染 ───────────────────────────────
function WebMarkdown({ content, fontSize, isDark }: { content: string; fontSize: number; isDark: boolean }) {
  const html = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { marked } = require('marked');
      return marked(content) as string;
    } catch {
      return `<pre style="white-space:pre-wrap">${content.replace(/</g, '&lt;')}</pre>`;
    }
  }, [content]);

  const bg = isDark ? '#1e1e2e' : '#ffffff';
  const text = isDark ? '#cdd6f4' : '#1a1a2e';
  const codeBg = isDark ? '#313244' : '#f4f4f8';
  const codeBorder = isDark ? '#45475a' : '#e0e0ef';
  const headingColor = isDark ? '#89b4fa' : '#4f46e5';
  const blockquoteBorder = isDark ? '#6c7086' : '#818cf8';
  const blockquoteBg = isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)';
  const tableHeaderBg = isDark ? '#313244' : '#f0f0f8';
  const tableBorder = isDark ? '#45475a' : '#e0e0ef';
  const strongColor = isDark ? '#f5c2e7' : '#6d28d9';

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: ${bg};
      color: ${text};
      font-size: ${fontSize}px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Noto Sans SC', sans-serif;
      line-height: 1.75;
      padding: 4px 2px 8px 2px;
      word-wrap: break-word;
    }
    h1,h2,h3,h4,h5,h6 {
      color: ${headingColor};
      font-weight: 700;
      margin: 1em 0 0.4em;
      line-height: 1.3;
    }
    h1 { font-size: ${fontSize * 1.5}px; padding-bottom: 0.2em; border-bottom: 2px solid ${codeBorder}; }
    h2 { font-size: ${fontSize * 1.3}px; padding-bottom: 0.15em; border-bottom: 1px solid ${codeBorder}; }
    h3 { font-size: ${fontSize * 1.15}px; }
    h4 { font-size: ${fontSize}px; }
    p { margin: 0.5em 0; }
    strong, b { color: ${strongColor}; font-weight: 700; }
    em, i { font-style: italic; opacity: 0.9; }
    code {
      background: ${codeBg};
      border: 1px solid ${codeBorder};
      border-radius: 4px;
      padding: 0.1em 0.4em;
      font-family: 'SF Mono', 'Cascadia Code', Menlo, monospace;
      font-size: 0.88em;
    }
    pre {
      background: ${codeBg};
      border: 1px solid ${codeBorder};
      border-radius: 8px;
      padding: 10px 12px;
      margin: 0.6em 0;
      overflow-x: auto;
    }
    pre code {
      background: none;
      border: none;
      padding: 0;
      font-size: ${fontSize * 0.85}px;
      line-height: 1.6;
    }
    blockquote {
      border-left: 3px solid ${blockquoteBorder};
      background: ${blockquoteBg};
      margin: 0.5em 0;
      padding: 0.4em 0.8em;
      border-radius: 0 6px 6px 0;
    }
    ul, ol { padding-left: 1.4em; margin: 0.4em 0; }
    li { margin: 0.2em 0; }
    hr { border: none; border-top: 1px solid ${codeBorder}; margin: 0.8em 0; }
    table { border-collapse: collapse; width: 100%; margin: 0.6em 0; font-size: ${fontSize * 0.9}px; }
    th, td { border: 1px solid ${tableBorder}; padding: 0.35em 0.6em; text-align: left; }
    th { background: ${tableHeaderBg}; font-weight: 600; }
    tr:nth-child(even) td { background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}; }
    a { color: ${headingColor}; text-decoration: none; }
  `;

  const srcDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${html}</body></html>`;

  // 估算高度：按字符数大致推算（避免 iframe 高度塌陷）
  const estLines = Math.max(content.split('\n').length * 1.4, content.length / 50);
  const estHeight = Math.max(120, Math.min(estLines * (fontSize * 1.75) + 32, 1200));

  return (
    <View style={[styles.webWrap, { height: estHeight }]}>
      {/* @ts-ignore - iframe is web-only */}
      <iframe
        srcDoc={srcDoc}
        style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'transparent' }}
        title="Answer"
        sandbox="allow-same-origin"
        scrolling="no"
      />
    </View>
  );
}

// ─── Android 端：原生 Text 渲染 ───────────────────────────────
// 将 Markdown 解析成 token 序列，再逐段渲染
type Token =
  | { type: 'h1' | 'h2' | 'h3'; text: string }
  | { type: 'p'; spans: Span[] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'ul' | 'ol'; items: Span[][] }
  | { type: 'hr' }
  | { type: 'blockquote'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

type Span = { text: string; bold?: boolean; italic?: boolean; code?: boolean };

function parseInline(text: string): Span[] {
  const spans: Span[] = [];
  // 解析 **bold**, *italic*, `code`
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) spans.push({ text: text.slice(last, m.index) });
    if (m[2]) spans.push({ text: m[2], bold: true });
    else if (m[3]) spans.push({ text: m[3], italic: true });
    else if (m[4]) spans.push({ text: m[4], code: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) spans.push({ text: text.slice(last) });
  return spans;
}

function parseMarkdown(md: string): Token[] {
  const tokens: Token[] = [];
  const lines = md.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 代码块
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      tokens.push({ type: 'code', lang, code: codeLines.join('\n') });
      i++;
      continue;
    }

    // 表格（简单检测）
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].match(/^\|[-| :]+\|/)) {
      const headers = line.split('|').map(s => s.trim()).filter(Boolean);
      i += 2; // 跳过分隔行
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(lines[i].split('|').map(s => s.trim()).filter(Boolean));
        i++;
      }
      tokens.push({ type: 'table', headers, rows });
      continue;
    }

    // 标题
    if (line.startsWith('### ')) { tokens.push({ type: 'h3', text: line.slice(4) }); i++; continue; }
    if (line.startsWith('## ')) { tokens.push({ type: 'h2', text: line.slice(3) }); i++; continue; }
    if (line.startsWith('# ')) { tokens.push({ type: 'h1', text: line.slice(2) }); i++; continue; }

    // hr
    if (line.match(/^[-*_]{3,}$/)) { tokens.push({ type: 'hr' }); i++; continue; }

    // blockquote
    if (line.startsWith('> ')) { tokens.push({ type: 'blockquote', text: line.slice(2) }); i++; continue; }

    // 无序列表
    if (line.match(/^[-*+] /)) {
      const items: Span[][] = [];
      while (i < lines.length && lines[i].match(/^[-*+] /)) {
        items.push(parseInline(lines[i].slice(2)));
        i++;
      }
      tokens.push({ type: 'ul', items });
      continue;
    }

    // 有序列表
    if (line.match(/^\d+\. /)) {
      const items: Span[][] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(parseInline(lines[i].replace(/^\d+\. /, '')));
        i++;
      }
      tokens.push({ type: 'ol', items });
      continue;
    }

    // 空行
    if (!line.trim()) { i++; continue; }

    // 普通段落
    tokens.push({ type: 'p', spans: parseInline(line) });
    i++;
  }

  return tokens;
}

function NativeMarkdown({ content, fontSize, colors }: { content: string; fontSize: number; colors: ReturnType<typeof getThemeColors> }) {
  const tokens = useMemo(() => parseMarkdown(content), [content]);
  const headingColor = colors.primary;

  const renderSpans = (spans: Span[], baseStyle?: object) =>
    spans.map((s, i) => (
      <Text
        key={i}
        style={[
          baseStyle,
          s.bold && { fontWeight: '700', color: colors.primary },
          s.italic && { fontStyle: 'italic' },
          s.code && {
            fontFamily: 'monospace',
            fontSize: fontSize * 0.88,
            backgroundColor: colors.surfaceElevated,
            color: colors.accent,
          },
        ]}
      >
        {s.text}
      </Text>
    ));

  return (
    <View>
      {tokens.map((token, idx) => {
        switch (token.type) {
          case 'h1':
            return (
              <Text key={idx} style={[styles.h1, { color: headingColor, fontSize: fontSize * 1.4, borderBottomColor: colors.border }]}>
                {token.text}
              </Text>
            );
          case 'h2':
            return (
              <Text key={idx} style={[styles.h2, { color: headingColor, fontSize: fontSize * 1.2, borderBottomColor: colors.border }]}>
                {token.text}
              </Text>
            );
          case 'h3':
            return (
              <Text key={idx} style={[styles.h3, { color: headingColor, fontSize: fontSize * 1.05 }]}>
                {token.text}
              </Text>
            );
          case 'p':
            return (
              <Text key={idx} style={[styles.p, { color: colors.textSecondary, fontSize }]}>
                {renderSpans(token.spans, { color: colors.textSecondary, fontSize })}
              </Text>
            );
          case 'code':
            return (
              <View key={idx} style={[styles.codeBlock, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                {token.lang ? (
                  <Text style={[styles.codeLang, { color: colors.textTertiary }]}>{token.lang}</Text>
                ) : null}
                <ScrollView horizontal showsHorizontalScrollIndicator>
                  <Text style={[styles.codeText, { color: colors.text }]}>{token.code}</Text>
                </ScrollView>
              </View>
            );
          case 'ul':
            return (
              <View key={idx} style={styles.list}>
                {token.items.map((spans, li) => (
                  <View key={li} style={styles.listItem}>
                    <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.listText, { color: colors.textSecondary, fontSize }]}>
                      {renderSpans(spans, { color: colors.textSecondary, fontSize })}
                    </Text>
                  </View>
                ))}
              </View>
            );
          case 'ol':
            return (
              <View key={idx} style={styles.list}>
                {token.items.map((spans, li) => (
                  <View key={li} style={styles.listItem}>
                    <Text style={[styles.olNum, { color: colors.primary, fontSize }]}>{li + 1}.</Text>
                    <Text style={[styles.listText, { color: colors.textSecondary, fontSize }]}>
                      {renderSpans(spans, { color: colors.textSecondary, fontSize })}
                    </Text>
                  </View>
                ))}
              </View>
            );
          case 'hr':
            return <View key={idx} style={[styles.hr, { backgroundColor: colors.border }]} />;
          case 'blockquote':
            return (
              <View key={idx} style={[styles.blockquote, { borderLeftColor: colors.primary, backgroundColor: colors.primaryLight }]}>
                <Text style={{ color: colors.textSecondary, fontSize }}>{token.text}</Text>
              </View>
            );
          case 'table':
            return (
              <ScrollView key={idx} horizontal style={styles.tableScroll}>
                <View>
                  {/* 表头 */}
                  <View style={[styles.tableRow, { backgroundColor: colors.primaryLight }]}>
                    {token.headers.map((h, hi) => (
                      <View key={hi} style={[styles.tableCell, { borderColor: colors.border }]}>
                        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize * 0.9 }}>{h}</Text>
                      </View>
                    ))}
                  </View>
                  {/* 数据行 */}
                  {token.rows.map((row, ri) => (
                    <View key={ri} style={[styles.tableRow, { backgroundColor: ri % 2 === 0 ? 'transparent' : colors.surfaceElevated }]}>
                      {row.map((cell, ci) => (
                        <View key={ci} style={[styles.tableCell, { borderColor: colors.border }]}>
                          <Text style={{ color: colors.textSecondary, fontSize: fontSize * 0.9 }}>{cell}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            );
          default:
            return null;
        }
      })}
    </View>
  );
}

// ─── 主入口 ───────────────────────────────────────────────────
export function MarkdownContent({ content, fontSize = 13 }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = getThemeColors(scheme);
  const isDark = scheme === 'dark';

  if (Platform.OS === 'web') {
    return <WebMarkdown content={content} fontSize={fontSize} isDark={isDark} />;
  }
  return <NativeMarkdown content={content} fontSize={fontSize} colors={colors} />;
}

const styles = StyleSheet.create({
  webWrap: { width: '100%', overflow: 'hidden' },
  h1: { fontWeight: '800', marginTop: 12, marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1 },
  h2: { fontWeight: '700', marginTop: 10, marginBottom: 4, paddingBottom: 3, borderBottomWidth: 1 },
  h3: { fontWeight: '700', marginTop: 8, marginBottom: 3 },
  p: { lineHeight: 22, marginBottom: 4 },
  codeBlock: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  codeLang: { fontSize: 10, marginBottom: 4, fontWeight: '600' },
  codeText: { fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
  list: { marginBottom: 4 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3, gap: 6 },
  bullet: { width: 5, height: 5, borderRadius: 3, marginTop: 7 },
  olNum: { fontWeight: '700', minWidth: 18 },
  listText: { flex: 1, lineHeight: 20 },
  hr: { height: 1, marginVertical: 8 },
  blockquote: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 4,
    marginVertical: 4,
    borderRadius: Radius.sm,
  },
  tableScroll: { marginVertical: 4 },
  tableRow: { flexDirection: 'row' },
  tableCell: { borderWidth: 1, padding: 6, minWidth: 80 },
});
