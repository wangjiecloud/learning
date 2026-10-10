/**
 * 动画步骤图组件
 * 支持节点 + 有向连线，点击"下一步"逐步高亮每个步骤
 * 使用 react-native-svg + Animated
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useColorScheme,
  Platform,
} from 'react-native';
import Svg, { Circle, Rect, Line, Path, Defs, Marker, Polygon, Text as SvgText } from 'react-native-svg';
import { getThemeColors, Spacing, Radius, Typography } from '../../theme';

export interface DiagramNode {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  shape?: 'rect' | 'circle' | 'diamond';
  label: string;
  sublabel?: string;
  color?: string;       // 高亮颜色
  step: number;         // 在第几步显示（0-indexed）
}

export interface DiagramEdge {
  from: string;         // node id
  to: string;           // node id
  label?: string;
  step: number;
  dashed?: boolean;
}

export interface DiagramStep {
  title: string;        // 步骤标题
  description: string;  // 步骤说明
}

export interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  steps: DiagramStep[];
  viewBox?: { width: number; height: number };
}

interface Props {
  data: DiagramData;
}

const DEFAULT_NODE_W = 100;
const DEFAULT_NODE_H = 44;

function getNodeCenter(node: DiagramNode) {
  const w = node.width ?? DEFAULT_NODE_W;
  const h = node.height ?? DEFAULT_NODE_H;
  return { cx: node.x + w / 2, cy: node.y + h / 2 };
}

function arrowPath(x1: number, y1: number, x2: number, y2: number): string {
  // 简单折线：直线 + 箭头
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return '';
  // 缩短终点（留出箭头空间）
  const ratio = Math.max(0, (len - 14) / len);
  const ex = x1 + dx * ratio;
  const ey = y1 + dy * ratio;
  return `M${x1},${y1} L${ex},${ey}`;
}

function ArrowHead({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return null;
  const nx = dx / len;
  const ny = dy / len;
  // 箭头顶点
  const ax = x2;
  const ay = y2;
  // 箭头两翼
  const w = 6;
  const l = 12;
  const lx = ax - nx * l + ny * w;
  const ly = ay - ny * l - nx * w;
  const rx = ax - nx * l - ny * w;
  const ry = ay - ny * l + nx * w;
  return (
    <Polygon
      points={`${ax},${ay} ${lx},${ly} ${rx},${ry}`}
      fill={color}
    />
  );
}

export function AnimatedDiagram({ data }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = getThemeColors(scheme);
  const isDark = scheme === 'dark';

  const [currentStep, setCurrentStep] = useState(-1); // -1 = 初始（全部隐藏）
  const totalSteps = data.steps.length;

  // 每个元素的透明度动画
  const nodeAnims = useRef<Record<string, Animated.Value>>({});
  const edgeAnims = useRef<Record<string, Animated.Value>>({});

  // 初始化动画值
  data.nodes.forEach((n) => {
    if (!nodeAnims.current[n.id]) {
      nodeAnims.current[n.id] = new Animated.Value(0);
    }
  });
  data.edges.forEach((e, i) => {
    const key = `${e.from}-${e.to}-${i}`;
    if (!edgeAnims.current[key]) {
      edgeAnims.current[key] = new Animated.Value(0);
    }
  });

  // 当步骤改变时，播放对应元素的淡入动画
  useEffect(() => {
    if (currentStep < 0) return;
    const toAnimate: Animated.Value[] = [];

    data.nodes.forEach((n) => {
      if (n.step === currentStep) {
        toAnimate.push(nodeAnims.current[n.id]);
      }
    });
    data.edges.forEach((e, i) => {
      if (e.step === currentStep) {
        const key = `${e.from}-${e.to}-${i}`;
        toAnimate.push(edgeAnims.current[key]);
      }
    });

    Animated.parallel(
      toAnimate.map((anim) =>
        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: false })
      )
    ).start();
  }, [currentStep]);

  const vw = data.viewBox?.width ?? 340;
  const vh = data.viewBox?.height ?? 260;

  const nodeById = Object.fromEntries(data.nodes.map((n) => [n.id, n]));

  // 主色
  const defaultNodeColor = isDark ? '#6366f1' : '#4f46e5';
  const dimColor = isDark ? '#374151' : '#e5e7eb';
  const lineColor = isDark ? '#6b7280' : '#9ca3af';
  const textColor = isDark ? '#f9fafb' : '#1f2937';

  const stepInfo = currentStep >= 0 && currentStep < totalSteps ? data.steps[currentStep] : null;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1e1e2e' : '#f8f8ff', borderColor: colors.border }]}>
      {/* SVG 画布 */}
      <View style={styles.svgWrap}>
        <Svg
          width="100%"
          height={vh}
          viewBox={`0 0 ${vw} ${vh}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 连线 */}
          {data.edges.map((edge, ei) => {
            const key = `${edge.from}-${edge.to}-${ei}`;
            const fromNode = nodeById[edge.from];
            const toNode = nodeById[edge.to];
            if (!fromNode || !toNode) return null;
            const { cx: x1, cy: y1 } = getNodeCenter(fromNode);
            const { cx: x2, cy: y2 } = getNodeCenter(toNode);
            const isVisible = edge.step <= currentStep;
            const isActive = edge.step === currentStep;
            const edgeColor = isActive ? (edge.dashed ? colors.accent : colors.primary) : (isVisible ? lineColor : dimColor);
            const anim = edgeAnims.current[key];
            const opacity = anim ?? new Animated.Value(isVisible ? 1 : 0);

            return (
              <Animated.View key={key} style={{ opacity }}>
                <Svg width={vw} height={vh} style={StyleSheet.absoluteFill} viewBox={`0 0 ${vw} ${vh}`}>
                  <Path
                    d={arrowPath(x1, y1, x2, y2)}
                    stroke={edgeColor}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    strokeDasharray={edge.dashed ? '5,4' : undefined}
                    fill="none"
                  />
                  <ArrowHead x1={x1} y1={y1} x2={x2} y2={y2} color={edgeColor} />
                  {edge.label ? (
                    <SvgText
                      x={(x1 + x2) / 2 + 4}
                      y={(y1 + y2) / 2 - 4}
                      fontSize={9}
                      fill={edgeColor}
                      textAnchor="middle"
                    >
                      {edge.label}
                    </SvgText>
                  ) : null}
                </Svg>
              </Animated.View>
            );
          })}

          {/* 节点 */}
          {data.nodes.map((node) => {
            const w = node.width ?? DEFAULT_NODE_W;
            const h = node.height ?? DEFAULT_NODE_H;
            const { cx, cy } = getNodeCenter(node);
            const isVisible = node.step <= currentStep;
            const isActive = node.step === currentStep;
            const fillColor = isActive
              ? (node.color ?? defaultNodeColor)
              : isVisible
              ? (isDark ? '#374151' : '#e0e7ff')
              : (isDark ? '#1f2937' : '#f3f4f6');
            const strokeColor = isActive
              ? (node.color ?? defaultNodeColor)
              : isVisible
              ? (isDark ? '#4b5563' : '#a5b4fc')
              : dimColor;
            const labelColor = isActive ? '#ffffff' : isVisible ? (isDark ? '#d1d5db' : '#374151') : (isDark ? '#4b5563' : '#d1d5db');

            const anim = nodeAnims.current[node.id] ?? new Animated.Value(isVisible ? 1 : 0);

            return (
              <Animated.View key={node.id} style={{ opacity: anim }}>
                <Svg width={vw} height={vh} style={StyleSheet.absoluteFill} viewBox={`0 0 ${vw} ${vh}`}>
                  {node.shape === 'circle' ? (
                    <Circle cx={cx} cy={cy} r={Math.min(w, h) / 2} fill={fillColor} stroke={strokeColor} strokeWidth={isActive ? 2 : 1.5} />
                  ) : node.shape === 'diamond' ? (
                    <Polygon
                      points={`${cx},${node.y} ${node.x + w},${cy} ${cx},${node.y + h} ${node.x},${cy}`}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                  ) : (
                    <Rect
                      x={node.x}
                      y={node.y}
                      width={w}
                      height={h}
                      rx={8}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                  )}
                  <SvgText
                    x={cx}
                    y={node.sublabel ? cy - 6 : cy + 4}
                    textAnchor="middle"
                    fontSize={node.sublabel ? 10 : 11}
                    fontWeight="700"
                    fill={labelColor}
                  >
                    {node.label}
                  </SvgText>
                  {node.sublabel ? (
                    <SvgText
                      x={cx}
                      y={cy + 10}
                      textAnchor="middle"
                      fontSize={8}
                      fill={isActive ? 'rgba(255,255,255,0.8)' : (isDark ? '#9ca3af' : '#6b7280')}
                    >
                      {node.sublabel}
                    </SvgText>
                  ) : null}
                </Svg>
              </Animated.View>
            );
          })}
        </Svg>
      </View>

      {/* 步骤说明 */}
      <View style={[styles.stepInfo, { borderTopColor: colors.border }]}>
        {stepInfo ? (
          <View style={[styles.stepBox, { backgroundColor: isDark ? '#312e81' : '#eef2ff', borderColor: isDark ? '#4338ca' : '#c7d2fe' }]}>
            <Text style={[styles.stepTitle, { color: isDark ? '#a5b4fc' : '#4338ca' }]}>
              步骤 {currentStep + 1}：{stepInfo.title}
            </Text>
            <Text style={[styles.stepDesc, { color: isDark ? '#d1d5db' : '#374151' }]}>
              {stepInfo.description}
            </Text>
          </View>
        ) : (
          <Text style={[styles.stepHint, { color: colors.textTertiary }]}>
            点击「下一步」开始演示
          </Text>
        )}
      </View>

      {/* 控制按钮 */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary, { borderColor: colors.border, opacity: currentStep < 0 ? 0.3 : 1 }]}
          onPress={() => {
            if (currentStep < 0) return;
            // 重置
            data.nodes.forEach((n) => { nodeAnims.current[n.id]?.setValue(0); });
            data.edges.forEach((e, i) => {
              const key = `${e.from}-${e.to}-${i}`;
              edgeAnims.current[key]?.setValue(0);
            });
            setCurrentStep(-1);
          }}
          disabled={currentStep < 0}
        >
          <Text style={[styles.btnText, { color: colors.textSecondary }]}>↺ 重置</Text>
        </TouchableOpacity>

        <View style={[styles.progressDots]}>
          {data.steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i <= currentStep ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, {
            backgroundColor: currentStep >= totalSteps - 1 ? colors.mastered : colors.primary,
            opacity: currentStep >= totalSteps - 1 ? 0.6 : 1,
          }]}
          onPress={() => {
            if (currentStep < totalSteps - 1) {
              setCurrentStep((s) => s + 1);
            }
          }}
          disabled={currentStep >= totalSteps - 1}
        >
          <Text style={styles.btnPrimaryText}>
            {currentStep < 0 ? '▶ 开始' : currentStep >= totalSteps - 1 ? '✓ 完成' : '下一步 →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  svgWrap: {
    width: '100%',
    padding: Spacing.sm,
  },
  stepInfo: {
    borderTopWidth: 1,
    padding: Spacing.md,
    minHeight: 64,
  },
  stepBox: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
  },
  stepTitle: {
    fontSize: Typography.size.sm,
    fontWeight: '700',
    marginBottom: 3,
  },
  stepDesc: {
    fontSize: Typography.size.sm,
    lineHeight: 18,
  },
  stepHint: {
    fontSize: Typography.size.sm,
    textAlign: 'center',
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  btn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  btnSecondary: {
    borderWidth: 1,
  },
  btnPrimary: {
    minWidth: 88,
    alignItems: 'center',
  },
  btnText: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
  },
  btnPrimaryText: {
    fontSize: Typography.size.sm,
    fontWeight: '700',
    color: '#ffffff',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 5,
    flex: 1,
    justifyContent: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
