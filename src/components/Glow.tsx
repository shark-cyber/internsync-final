import React, { useEffect } from 'react';
import { Platform } from 'react-native';

export type Rect = { x: number; y: number; w: number; h: number; r: number };
const COLORS = ['#4e8265', '#161618', '#9a5757', '#161618', '#4e8265'];
const GRAD = 'conic-gradient(from var(--igAngle), #4e8265, #161618, #9a5757, #161618, #4e8265)';

// Glow renders BEHIND its content; the opaque content covers the centre,
// leaving a thin gradient ring + a soft blurred halo around the edge.
export function Glow({ width, height, rect, blur = 26 }: { width: number; height: number; rect: Rect; blur?: number }) {
  if (!width || !height) return null;
  return Platform.OS === 'web'
    ? <WebGlow width={width} height={height} rect={rect} blur={blur} />
    : <NativeGlow width={width} height={height} rect={rect} blur={blur} />;
}

const grow = (r: Rect, d: number): Rect => ({ x: r.x - d, y: r.y - d, w: r.w + d * 2, h: r.h + d * 2, r: r.r + d });

/* ---------- native (Skia sweep gradient + blur, hollow strokes) ---------- */
function NativeGlow({ width, height, rect, blur }: { width: number; height: number; rect: Rect; blur: number }) {
  const { Canvas, RoundedRect, SweepGradient, vec, Group, BlurMask } = require('@shopify/react-native-skia');
  const { useSharedValue, useDerivedValue, withRepeat, withTiming, Easing } = require('react-native-reanimated');
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.linear }), -1, false);
  }, []);
  const transform = useDerivedValue(() => [{ rotate: rot.value * 2 * Math.PI }]);
  return (
    <Canvas style={{ position: 'absolute', width, height, zIndex: 0 }} pointerEvents="none">
      <Group>
        <BlurMask blur={blur} style="normal" />
        <RoundedRect x={rect.x} y={rect.y} width={rect.w} height={rect.h} r={rect.r} style="stroke" strokeWidth={7} opacity={0.55}>
          <SweepGradient c={vec(cx, cy)} colors={COLORS} origin={vec(cx, cy)} transform={transform} />
        </RoundedRect>
      </Group>
      <RoundedRect x={rect.x} y={rect.y} width={rect.w} height={rect.h} r={rect.r} style="stroke" strokeWidth={3}>
        <SweepGradient c={vec(cx, cy)} colors={COLORS} origin={vec(cx, cy)} transform={transform} />
      </RoundedRect>
    </Canvas>
  );
}

/* ---------- web (exact CSS conic gradient, behind the content) ---------- */
let cssInjected = false;
function injectCss() {
  if (cssInjected || typeof document === 'undefined') return;
  cssInjected = true;
  const s = document.createElement('style');
  s.textContent =
    '@property --igAngle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }' +
    '@keyframes igspin { to { --igAngle: 360deg; } }';
  document.head.appendChild(s);
}
function WebGlow({ rect, blur }: { width: number; height: number; rect: Rect; blur: number }) {
  useEffect(injectCss, []);
  const halo = grow(rect, 10);
  const ring = grow(rect, 3);
  const div = (r: Rect, extra: any) =>
    React.createElement('div', {
      style: {
        position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: r.r,
        background: GRAD, animation: 'igspin 9s linear infinite', pointerEvents: 'none', zIndex: 0, ...extra,
      },
    });
  return React.createElement(
    React.Fragment, null,
    div(halo, { filter: `blur(${blur}px)`, opacity: 0.55 }),
    div(ring, {})
  );
}
