"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface PortraitAuraCanvasProps {
  readonly baseImageSrc: string;
  readonly auraImageSrc: string;
  readonly isAuraForced: boolean;
}

const TEX_WIDTH = 1240;
const TEX_HEIGHT = 1000;
const TEX_ASPECT = TEX_WIDTH / TEX_HEIGHT;

/**
 * Builds the aligned, shadow-free, transparent-background cutout canvas for the Aura statue + Cyber-Wolf.
 * Leaves clean transparent margins on top, left, and right while anchoring row 825 at the bottom
 * so the left arm, chest, and right wolf tail sit 100% flush along the Hero bottom border.
 */
function createAuraCutoutCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_WIDTH;
  canvas.height = TEX_HEIGHT;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  const auraDrawH = Math.round(TEX_HEIGHT * (955 / 815));
  const auraDrawW = Math.round(auraDrawH * (img.naturalWidth / Math.max(1, img.naturalHeight)));
  const auraDrawX = Math.round((TEX_WIDTH - auraDrawW) * 0.5) - 18;
  const auraDrawY = -12;

  ctx.clearRect(0, 0, TEX_WIDTH, TEX_HEIGHT);
  ctx.drawImage(img, auraDrawX, auraDrawY, auraDrawW, auraDrawH);

  const imageData = ctx.getImageData(0, 0, TEX_WIDTH, TEX_HEIGHT);
  const data = imageData.data;
  const totalPixels = TEX_WIDTH * TEX_HEIGHT;

  const lumaArr = new Float32Array(totalPixels);
  const chromaArr = new Uint8Array(totalPixels);
  for (let p = 0; p < totalPixels; p++) {
    const idx = p * 4;
    const r = data[idx] ?? 0;
    const g = data[idx + 1] ?? 0;
    const b = data[idx + 2] ?? 0;
    lumaArr[p] = 0.299 * r + 0.587 * g + 0.114 * b;
    chromaArr[p] = Math.max(r, g, b) - Math.min(r, g, b);
  }

  // Compute 3x3 local luma range to distinguish soft studio drop-shadow from crisp metallic edges
  const range3x3 = new Float32Array(totalPixels);
  for (let y = 1; y < TEX_HEIGHT - 1; y++) {
    for (let x = 1; x < TEX_WIDTH - 1; x++) {
      const p = y * TEX_WIDTH + x;
      let minL = 255;
      let maxL = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const row = (y + dy) * TEX_WIDTH + x;
        for (let dx = -1; dx <= 1; dx++) {
          const v = lumaArr[row + dx] ?? 0;
          if (v < minL) minL = v;
          if (v > maxL) maxL = v;
        }
      }
      range3x3[p] = maxL - minL;
    }
  }

  const visited = new Uint8Array(totalPixels);
  const isBg = new Uint8Array(totalPixels);

  const isAuraBg = (p: number): boolean => {
    const a = data[p * 4 + 3] ?? 0;
    if (a < 20) return true;
    const luma = lumaArr[p] ?? 0;
    const chroma = chromaArr[p] ?? 0;
    const grad = range3x3[p] ?? 0;
    if (luma > 234 && chroma <= 14) return true;
    if (luma > 130 && chroma <= 10 && grad <= 18) return true;
    return false;
  };

  const queue = new Int32Array(totalPixels);
  let head = 0;
  let tail = 0;

  const pushSeed = (x: number, y: number) => {
    const p = y * TEX_WIDTH + x;
    if (visited[p]) return;
    visited[p] = 1;
    if (isAuraBg(p)) {
      isBg[p] = 1;
      queue[tail++] = p;
    }
  };

  for (let x = 0; x < TEX_WIDTH; x++) {
    pushSeed(x, 0);
    pushSeed(x, 1);
  }
  for (let y = 0; y < TEX_HEIGHT; y++) {
    pushSeed(0, y);
    pushSeed(1, y);
    pushSeed(TEX_WIDTH - 1, y);
    pushSeed(TEX_WIDTH - 2, y);
  }
  for (let x = 0; x < Math.round(TEX_WIDTH * 0.18); x++) {
    pushSeed(x, TEX_HEIGHT - 1);
  }
  for (let x = Math.round(TEX_WIDTH * 0.9); x < TEX_WIDTH; x++) {
    pushSeed(x, TEX_HEIGHT - 1);
  }

  while (head < tail) {
    const curr = queue[head++]!;
    const cx = curr % TEX_WIDTH;
    const cy = (curr / TEX_WIDTH) | 0;
    const neighbors = [
      cx > 0 ? curr - 1 : -1,
      cx < TEX_WIDTH - 1 ? curr + 1 : -1,
      cy > 0 ? curr - TEX_WIDTH : -1,
      cy < TEX_HEIGHT - 1 ? curr + TEX_WIDTH : -1,
    ];
    for (let i = 0; i < 4; i++) {
      const np = neighbors[i]!;
      if (np >= 0 && !visited[np]) {
        visited[np] = 1;
        if (isAuraBg(np)) {
          isBg[np] = 1;
          queue[tail++] = np;
        }
      }
    }
  }

  // Dilate 2px into remaining low-chroma halo fringe
  for (let step = 0; step < 2; step++) {
    const prev = new Uint8Array(isBg);
    for (let y = 1; y < TEX_HEIGHT - 1; y++) {
      for (let x = 1; x < TEX_WIDTH - 1; x++) {
        const p = y * TEX_WIDTH + x;
        if (prev[p]) continue;
        if (
          (prev[p - 1] || prev[p + 1] || prev[p - TEX_WIDTH] || prev[p + TEX_WIDTH]) &&
          (lumaArr[p] ?? 0) > 145 &&
          (chromaArr[p] ?? 0) <= 12 &&
          (range3x3[p] ?? 0) <= 36
        ) {
          isBg[p] = 1;
        }
      }
    }
  }

  // Apply cutout across ALL pixels (including 0 and TEX_WIDTH-1 borders!) and anti-aliased edge feathering
  for (let p = 0; p < totalPixels; p++) {
    if (isBg[p]) {
      data[p * 4] = 0;
      data[p * 4 + 1] = 0;
      data[p * 4 + 2] = 0;
      data[p * 4 + 3] = 0;
    }
  }

  for (let y = 1; y < TEX_HEIGHT - 1; y++) {
    for (let x = 1; x < TEX_WIDTH - 1; x++) {
      const p = y * TEX_WIDTH + x;
      if (!isBg[p]) {
        const bgNeighbors =
          (isBg[p - 1] ?? 0) +
          (isBg[p + 1] ?? 0) +
          (isBg[p - TEX_WIDTH] ?? 0) +
          (isBg[p + TEX_WIDTH] ?? 0);
        if (bgNeighbors > 0) {
          data[p * 4 + 3] = Math.round((data[p * 4 + 3] ?? 255) * (1 - bgNeighbors * 0.2));
        }
      }
    }
  }

  // Clear 4px outer border on top, left, and right to guarantee zero canvas frame border artifacts
  for (let y = 0; y < TEX_HEIGHT; y++) {
    for (let x = 0; x < 4; x++) {
      const lIdx = (y * TEX_WIDTH + x) * 4;
      const rIdx = (y * TEX_WIDTH + (TEX_WIDTH - 1 - x)) * 4;
      data[lIdx] = data[lIdx + 1] = data[lIdx + 2] = data[lIdx + 3] = 0;
      data[rIdx] = data[rIdx + 1] = data[rIdx + 2] = data[rIdx + 3] = 0;
    }
  }
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < TEX_WIDTH; x++) {
      const tIdx = (y * TEX_WIDTH + x) * 4;
      data[tIdx] = data[tIdx + 1] = data[tIdx + 2] = data[tIdx + 3] = 0;
    }
  }

  // Ensure the bottom-left silver sleeve under the wolf's outermost claw touches y = TEX_HEIGHT - 1 cleanly
  for (let x = 200; x <= 310; x++) {
    let lastY = -1;
    for (let y = 880; y < TEX_HEIGHT; y++) {
      if ((data[(y * TEX_WIDTH + x) * 4 + 3] ?? 0) > 200) {
        lastY = y;
      }
    }
    if (lastY >= 935 && lastY < TEX_HEIGHT - 1) {
      const sIdx = ((lastY - 3) * TEX_WIDTH + x) * 4;
      const sr = data[sIdx] ?? 0;
      const sg = data[sIdx + 1] ?? 0;
      const sb = data[sIdx + 2] ?? 0;
      for (let y = lastY; y < TEX_HEIGHT; y++) {
        const dIdx = (y * TEX_WIDTH + x) * 4;
        data[dIdx] = sr;
        data[dIdx + 1] = sg;
        data[dIdx + 2] = sb;
        data[dIdx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Builds the aligned, transparent-background cutout canvas for the Base Portrait.
 * Scales and aligns to match the Aura statue's exact facial landmarks and reconstructs natural
 * curved outer sleeve contours so there are zero vertical cut-off photo borders (`batas foto`).
 */
function createBaseCutoutCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_WIDTH;
  canvas.height = TEX_HEIGHT;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  const auraDrawH = Math.round(TEX_HEIGHT * (955 / 815));
  const auraDrawY = -12;
  const portDrawH = Math.round(auraDrawH * 0.942);
  const portDrawW = Math.round(portDrawH * (img.naturalWidth / Math.max(1, img.naturalHeight)));
  const portDrawX = Math.round((TEX_WIDTH - portDrawW) * 0.5) - 12;
  const portDrawY = auraDrawY + 4;

  ctx.clearRect(0, 0, TEX_WIDTH, TEX_HEIGHT);
  ctx.drawImage(img, portDrawX, portDrawY, portDrawW, portDrawH);

  const imageData = ctx.getImageData(0, 0, TEX_WIDTH, TEX_HEIGHT);
  const data = imageData.data;
  const totalPixels = TEX_WIDTH * TEX_HEIGHT;
  const visited = new Uint8Array(totalPixels);
  const isBg = new Uint8Array(totalPixels);

  const isPortBg = (p: number): boolean => {
    const idx = p * 4;
    const a = data[idx + 3] ?? 0;
    if (a < 20) return true;
    const r = data[idx] ?? 0;
    const g = data[idx + 1] ?? 0;
    const b = data[idx + 2] ?? 0;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    return luma > 212 && chroma < 22;
  };

  const queue = new Int32Array(totalPixels);
  let head = 0;
  let tail = 0;

  const pushSeed = (x: number, y: number) => {
    const p = y * TEX_WIDTH + x;
    if (visited[p]) return;
    visited[p] = 1;
    if (isPortBg(p)) {
      isBg[p] = 1;
      queue[tail++] = p;
    }
  };

  for (let x = 0; x < TEX_WIDTH; x++) {
    pushSeed(x, 0);
    pushSeed(x, 1);
  }
  for (let y = 0; y < TEX_HEIGHT; y++) {
    pushSeed(0, y);
    pushSeed(1, y);
    pushSeed(TEX_WIDTH - 1, y);
    pushSeed(TEX_WIDTH - 2, y);
  }

  while (head < tail) {
    const curr = queue[head++]!;
    const cx = curr % TEX_WIDTH;
    const cy = (curr / TEX_WIDTH) | 0;
    const neighbors = [
      cx > 0 ? curr - 1 : -1,
      cx < TEX_WIDTH - 1 ? curr + 1 : -1,
      cy > 0 ? curr - TEX_WIDTH : -1,
      cy < TEX_HEIGHT - 1 ? curr + TEX_WIDTH : -1,
    ];
    for (let i = 0; i < 4; i++) {
      const np = neighbors[i]!;
      if (np >= 0 && !visited[np]) {
        visited[np] = 1;
        if (isPortBg(np)) {
          isBg[np] = 1;
          queue[tail++] = np;
        }
      }
    }
  }

  for (let p = 0; p < totalPixels; p++) {
    if (isBg[p]) {
      data[p * 4] = 0;
      data[p * 4 + 1] = 0;
      data[p * 4 + 2] = 0;
      data[p * 4 + 3] = 0;
    }
  }

  for (let y = 1; y < TEX_HEIGHT - 1; y++) {
    for (let x = 1; x < TEX_WIDTH - 1; x++) {
      const p = y * TEX_WIDTH + x;
      if (!isBg[p]) {
        const bgNeighbors =
          (isBg[p - 1] ?? 0) +
          (isBg[p + 1] ?? 0) +
          (isBg[p - TEX_WIDTH] ?? 0) +
          (isBg[p + TEX_WIDTH] ?? 0);
        if (bgNeighbors > 0) {
          data[p * 4 + 3] = Math.round((data[p * 4 + 3] ?? 255) * (1 - bgNeighbors * 0.2));
        }
      }
    }
  }

  // Clear 4px outer border on top, left, and right to guarantee zero canvas frame border artifacts
  for (let y = 0; y < TEX_HEIGHT; y++) {
    for (let x = 0; x < 4; x++) {
      const lIdx = (y * TEX_WIDTH + x) * 4;
      const rIdx = (y * TEX_WIDTH + (TEX_WIDTH - 1 - x)) * 4;
      data[lIdx] = data[lIdx + 1] = data[lIdx + 2] = data[lIdx + 3] = 0;
      data[rIdx] = data[rIdx + 1] = data[rIdx + 2] = data[rIdx + 3] = 0;
    }
  }
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < TEX_WIDTH; x++) {
      const tIdx = (y * TEX_WIDTH + x) * 4;
      data[tIdx] = data[tIdx + 1] = data[tIdx + 2] = data[tIdx + 3] = 0;
    }
  }

  // Continue natural curved sleeve silhouette where original vertical photo edges clipped the arms
  let firstClippedLeftY = -1;
  let firstClippedRightY = -1;
  const rightBorderX = portDrawX + portDrawW - 5;

  for (let y = 580; y < TEX_HEIGHT; y++) {
    const lIdx = (y * TEX_WIDTH + (portDrawX + 1)) * 4;
    if (firstClippedLeftY === -1 && (data[lIdx + 3] ?? 0) > 200 && (data[lIdx] ?? 255) < 60) {
      firstClippedLeftY = y;
    }
    const rIdx = (y * TEX_WIDTH + (rightBorderX - 1)) * 4;
    if (firstClippedRightY === -1 && (data[rIdx + 3] ?? 0) > 200 && (data[rIdx] ?? 255) < 60) {
      firstClippedRightY = y;
    }
  }

  if (firstClippedLeftY !== -1) {
    for (let y = firstClippedLeftY; y < TEX_HEIGHT; y++) {
      const t = (y - firstClippedLeftY) / (TEX_HEIGHT - firstClippedLeftY);
      const arch = Math.sin(t * Math.PI * 0.85) * 24;
      const targetLeftX = portDrawX + 1 - arch;
      const sampleX = portDrawX + 5;
      const sIdx = (y * TEX_WIDTH + sampleX) * 4;
      const sr = data[sIdx] ?? 0;
      const sg = data[sIdx + 1] ?? 0;
      const sb = data[sIdx + 2] ?? 0;
      const startX = Math.floor(targetLeftX);
      for (let tx = startX; tx <= portDrawX + 2; tx++) {
        const dIdx = (y * TEX_WIDTH + tx) * 4;
        const edgeAlpha = tx === startX ? Math.round((1 - (targetLeftX - startX)) * 255) : 255;
        data[dIdx] = sr;
        data[dIdx + 1] = sg;
        data[dIdx + 2] = sb;
        data[dIdx + 3] = Math.max(data[dIdx + 3] ?? 0, edgeAlpha);
      }
    }
  }

  if (firstClippedRightY !== -1) {
    for (let y = firstClippedRightY; y < TEX_HEIGHT; y++) {
      const t = (y - firstClippedRightY) / (TEX_HEIGHT - firstClippedRightY);
      const arch = Math.sin(t * Math.PI * 0.85) * 24;
      const targetRightX = rightBorderX - 1 + arch;
      const sampleX = rightBorderX - 5;
      const sIdx = (y * TEX_WIDTH + sampleX) * 4;
      const sr = data[sIdx] ?? 0;
      const sg = data[sIdx + 1] ?? 0;
      const sb = data[sIdx + 2] ?? 0;
      const endX = Math.ceil(targetRightX);
      for (let tx = rightBorderX - 2; tx <= endX; tx++) {
        const dIdx = (y * TEX_WIDTH + tx) * 4;
        const edgeAlpha = tx === endX ? Math.round((1 - (endX - targetRightX)) * 255) : 255;
        data[dIdx] = sr;
        data[dIdx + 1] = sg;
        data[dIdx + 2] = sb;
        data[dIdx + 3] = Math.max(data[dIdx + 3] ?? 0, edgeAlpha);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform sampler2D uBaseTex;
  uniform sampler2D uAuraTex;
  uniform vec2 uMouse;
  uniform vec2 uTrailMouse;
  uniform float uHover;
  uniform float uToggleMode;
  uniform float uTime;
  uniform float uContainerAspect;
  uniform float uTexAspect;

  varying vec2 vUv;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(
      0.211324865405187,
      0.366025403784439,
      -0.577350269189626,
      0.024390243902439
    );
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  vec2 toTexUv(vec2 inUv) {
    if (uContainerAspect >= uTexAspect) {
      float scaleX = uContainerAspect / uTexAspect;
      return vec2((inUv.x - 0.5) * scaleX + 0.5, inUv.y);
    } else {
      float scaleY = uTexAspect / uContainerAspect;
      return vec2(inUv.x, inUv.y * scaleY);
    }
  }

  void main() {
    vec2 uv = toTexUv(vUv);
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.0);
      return;
    }

    vec4 baseCol = texture2D(uBaseTex, uv);
    vec4 auraCol = texture2D(uAuraTex, uv);

    vec2 mPrimary = toTexUv(uMouse);
    vec2 mTrail = toTexUv(uTrailMouse);

    // Aspect-scaled coordinates for vertical oval liquid metaball (like rinlayheang.me)
    vec2 metric = vec2(uTexAspect * 1.15, 0.88);
    float d1 = length((uv - mPrimary) * metric);
    float d2 = length((uv - mTrail) * metric) * 1.18;

    // Smooth metaball union (smin) between primary cursor and lagged trail
    float k = 0.08;
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    float rawDist = mix(d2, d1, h) - k * h * (1.0 - h);

    // Multi-layered animated noise for liquid energy contour
    float n1 = snoise(uv * 4.2 + vec2(uTime * 0.45, -uTime * 0.35));
    float n2 = snoise(uv * 8.5 - vec2(uTime * 0.6, uTime * 0.5)) * 0.42;
    float noiseVal = (n1 + n2) * 0.022;

    float dist = rawDist + noiseVal;
    float radius = 0.215 * uHover;

    // Hover lens mask: 1.0 inside cursor lens, 0.0 outside
    float lensMask = uHover * (1.0 - smoothstep(radius - 0.018, radius + 0.018, dist));

    // Invert behavior when switched:
    // - Normal Mode (uToggleMode = 0.0): default is Base (0.0), hovering reveals Aura (1.0)
    // - Switched Mode (uToggleMode = 1.0): default is Aura (1.0), hovering reveals Base (0.0)
    float auraMix = mix(lensMask, 1.0 - lensMask, uToggleMode);

    // Premultiplied alpha compositing so transparent pixels NEVER bleed background RGB
    float wBase = baseCol.a * (1.0 - auraMix);
    float wAura = auraCol.a * auraMix;
    float mixedAlpha = wBase + wAura;
    vec3 mixedRgb = (baseCol.rgb * wBase + auraCol.rgb * wAura) / max(mixedAlpha, 0.0001);

    // Thin, crisp electric-gold neon contour along the active hover lens boundary
    float coreLine = uHover
      * smoothstep(radius - 0.012, radius - 0.001, dist)
      * (1.0 - smoothstep(radius - 0.001, radius + 0.010, dist));
    float softHalo = uHover
      * smoothstep(radius - 0.028, radius - 0.001, dist)
      * (1.0 - smoothstep(radius - 0.001, radius + 0.026, dist));

    float silhouetteMask = clamp(max(baseCol.a, auraCol.a), 0.0, 1.0);
    float glowAlpha = clamp((coreLine * 1.15 + softHalo * 0.42) * silhouetteMask, 0.0, 1.0);

    vec3 glowColor = mix(vec3(0.96, 0.78, 0.16), vec3(1.0, 0.96, 0.68), coreLine);

    // Proper alpha-over compositing for the neon rim
    float outAlpha = mixedAlpha + glowAlpha * (1.0 - mixedAlpha);
    vec3 outRgb = (mixedRgb * mixedAlpha * (1.0 - glowAlpha) + glowColor * glowAlpha) / max(outAlpha, 0.0001);

    gl_FragColor = vec4(outRgb, outAlpha);
  }
`;

export function PortraitAuraCanvas({
  baseImageSrc,
  auraImageSrc,
  isAuraForced,
}: PortraitAuraCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isReducedMotion = useReducedMotion();
  const isAuraForcedRef = useRef<boolean>(isAuraForced);

  useEffect(() => {
    isAuraForcedRef.current = isAuraForced;
  }, [isAuraForced]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 620;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const uniforms = {
      uBaseTex: { value: new THREE.Texture() },
      uAuraTex: { value: new THREE.Texture() },
      uMouse: { value: new THREE.Vector2(0.5, 0.55) },
      uTrailMouse: { value: new THREE.Vector2(0.5, 0.55) },
      uHover: { value: 0.0 },
      uToggleMode: { value: isAuraForcedRef.current ? 1.0 : 0.0 },
      uTime: { value: 0.0 },
      uContainerAspect: { value: width / Math.max(1, height) },
      uTexAspect: { value: TEX_ASPECT },
    };

    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let disposed = false;

    const loadImg = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    Promise.all([loadImg(baseImageSrc), loadImg(auraImageSrc)])
      .then(([baseImg, auraImg]) => {
        if (disposed) return;

        const baseCutout = createBaseCutoutCanvas(baseImg);
        const auraCutout = createAuraCutoutCanvas(auraImg);

        const baseTexture = new THREE.CanvasTexture(baseCutout);
        baseTexture.minFilter = THREE.LinearFilter;
        baseTexture.magFilter = THREE.LinearFilter;
        baseTexture.needsUpdate = true;

        const auraTexture = new THREE.CanvasTexture(auraCutout);
        auraTexture.minFilter = THREE.LinearFilter;
        auraTexture.magFilter = THREE.LinearFilter;
        auraTexture.needsUpdate = true;

        uniforms.uBaseTex.value.dispose();
        uniforms.uAuraTex.value.dispose();
        uniforms.uBaseTex.value = baseTexture;
        uniforms.uAuraTex.value = auraTexture;
      })
      .catch(() => {
        // Fallback if image load fails
      });

    // Spring-interpolated pointer & trail state
    const targetMouse = { x: 0.5, y: 0.58 };
    const currentMouse = { x: 0.5, y: 0.58 };
    const trailMouse = { x: 0.5, y: 0.58 };
    let targetHover = 0.0;
    let currentHover = 0.0;
    let currentToggle = isAuraForcedRef.current ? 1.0 : 0.0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / Math.max(1, rect.width);
      const ny = 1.0 - (e.clientY - rect.top) / Math.max(1, rect.height);
      targetMouse.x = Math.max(0.0, Math.min(1.0, nx));
      targetMouse.y = Math.max(0.0, Math.min(1.0, ny));
      targetHover = 1.0;
    };

    const handlePointerEnter = () => {
      targetHover = 1.0;
    };

    const handlePointerLeave = () => {
      targetHover = 0.0;
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerenter", handlePointerEnter);
    container.addEventListener("pointerleave", handlePointerLeave);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 620;
      renderer.setSize(w, h);
      uniforms.uContainerAspect.value = w / Math.max(1, h);
    };

    window.addEventListener("resize", handleResize);

    let rafId = 0;
    const startTime = performance.now();

    const animate = (now: number) => {
      rafId = window.requestAnimationFrame(animate);

      const elapsed = (now - startTime) * 0.001;
      uniforms.uTime.value = isReducedMotion ? 0.0 : elapsed;

      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.16;
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.16;
      trailMouse.x += (currentMouse.x - trailMouse.x) * 0.075;
      trailMouse.y += (currentMouse.y - trailMouse.y) * 0.075;
      currentHover += (targetHover - currentHover) * 0.12;

      const targetToggle = isAuraForcedRef.current ? 1.0 : 0.0;
      currentToggle += (targetToggle - currentToggle) * 0.12;

      uniforms.uMouse.value.set(currentMouse.x, currentMouse.y);
      uniforms.uTrailMouse.value.set(trailMouse.x, trailMouse.y);
      uniforms.uHover.value = currentHover;
      uniforms.uToggleMode.value = currentToggle;

      renderer.render(scene, camera);
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerenter", handlePointerEnter);
      container.removeEventListener("pointerleave", handlePointerLeave);
      geometry.dispose();
      material.dispose();
      uniforms.uBaseTex.value.dispose();
      uniforms.uAuraTex.value.dispose();
      renderer.dispose();
    };
  }, [baseImageSrc, auraImageSrc, isReducedMotion]);

  return (
    <div
      ref={containerRef}
      aria-label="Interactive 3D Shader Portrait of Aryo Ristiawan Machfudz — hover or click Show Aura to switch between Normal Portrait and Cyber-Wolf Aura"
      className="relative h-full w-full cursor-crosshair select-none drop-shadow-[0_18px_28px_rgba(10,17,32,0.22)]"
    />
  );
}
