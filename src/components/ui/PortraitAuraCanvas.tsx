"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface PortraitAuraCanvasProps {
  readonly baseImageSrc: string;
  readonly auraImageSrc: string;
  readonly isAuraForced: boolean;
}

/**
 * Flood-fill exterior background removal on an offscreen canvas.
 * Removes connected white / studio-gray background pixels starting from the image borders
 * while keeping interior white shirt collars and bright silver metallic highlights 100% opaque.
 */
function createCutoutCanvas(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  scaleAdjust = 1.0,
  offsetYRatio = 0.0
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  // Draw image anchored at bottom-center so head & shoulders align between Base & Aura
  const imgAspect = img.naturalWidth / Math.max(1, img.naturalHeight);
  const drawHeight = targetHeight * scaleAdjust;
  const drawWidth = drawHeight * imgAspect;
  const drawX = (targetWidth - drawWidth) * 0.5;
  const drawY = targetHeight - drawHeight + targetHeight * offsetYRatio;

  ctx.clearRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imageData.data;
  const totalPixels = targetWidth * targetHeight;
  const visited = new Uint8Array(totalPixels);
  const isBg = new Uint8Array(totalPixels);

  // Helper to check if a pixel is part of the studio white/light-gray background
  const isStudioBackground = (idx: number): boolean => {
    const a = data[idx + 3] ?? 0;
    if (a < 20) return true;
    const r = data[idx] ?? 0;
    const g = data[idx + 1] ?? 0;
    const b = data[idx + 2] ?? 0;
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const chroma = maxC - minC;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    // White or neutral studio drop-shadow gray on the exterior
    return luma > 212 && chroma < 22;
  };

  // BFS Queue seeded from top, left, and right borders (not bottom, where the suit touches)
  const queue = new Int32Array(totalPixels);
  let head = 0;
  let tail = 0;

  const pushSeed = (x: number, y: number) => {
    const p = y * targetWidth + x;
    if (visited[p]) return;
    visited[p] = 1;
    if (isStudioBackground(p * 4)) {
      isBg[p] = 1;
      queue[tail++] = p;
    }
  };

  for (let x = 0; x < targetWidth; x++) {
    pushSeed(x, 0);
    pushSeed(x, 1);
  }
  for (let y = 0; y < targetHeight; y++) {
    pushSeed(0, y);
    pushSeed(1, y);
    pushSeed(targetWidth - 1, y);
    pushSeed(targetWidth - 2, y);
  }

  while (head < tail) {
    const curr = queue[head++]!;
    const cx = curr % targetWidth;
    const cy = (curr / targetWidth) | 0;

    // 4-neighbors
    const neighbors = [
      cx > 0 ? curr - 1 : -1,
      cx < targetWidth - 1 ? curr + 1 : -1,
      cy > 0 ? curr - targetWidth : -1,
      cy < targetHeight - 1 ? curr + targetWidth : -1,
    ];

    for (let i = 0; i < 4; i++) {
      const np = neighbors[i]!;
      if (np >= 0 && !visited[np]) {
        visited[np] = 1;
        if (isStudioBackground(np * 4)) {
          isBg[np] = 1;
          queue[tail++] = np;
        }
      }
    }
  }

  // Apply alpha cutout with 1px soft edge feathering
  for (let y = 1; y < targetHeight - 1; y++) {
    for (let x = 1; x < targetWidth - 1; x++) {
      const p = y * targetWidth + x;
      if (isBg[p]) {
        data[p * 4 + 3] = 0;
      } else {
        // Check if adjacent to background for soft anti-aliased edge
        const bgNeighbors =
          (isBg[p - 1] ?? 0) +
          (isBg[p + 1] ?? 0) +
          (isBg[p - targetWidth] ?? 0) +
          (isBg[p + targetWidth] ?? 0);
        if (bgNeighbors > 0) {
          data[p * 4 + 3] = Math.round((data[p * 4 + 3] ?? 255) * (1 - bgNeighbors * 0.18));
        }
      }
    }
  }

  // Clear 1px outer border
  for (let x = 0; x < targetWidth; x++) {
    data[x * 4 + 3] = 0;
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
  uniform float uHover;
  uniform float uToggleMode;
  uniform float uTime;

  varying vec2 vUv;

  // 2D Simplex Noise for organic liquid aura edge
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

  void main() {
    vec4 baseCol = texture2D(uBaseTex, vUv);
    vec4 auraCol = texture2D(uAuraTex, vUv);

    // Aspect-corrected coordinates for organic blob calculation
    vec2 aspect = vec2(0.86, 1.0);
    vec2 p = vUv * aspect;
    vec2 m = uMouse * aspect;

    // Multi-layered animated noise for liquid energy contour
    float n1 = snoise(vUv * 4.5 + vec2(uTime * 0.45, -uTime * 0.35));
    float n2 = snoise(vUv * 9.0 - vec2(uTime * 0.6, uTime * 0.5)) * 0.45;
    float noiseVal = (n1 + n2) * 0.065;

    // Distance from pointer
    float dist = length(p - m) + noiseVal;

    // Active radius combines hover lens and full SHOW AURA toggle
    float hoverRadius = uHover * 0.34;
    float toggleRadius = uToggleMode * 1.35;
    float activeRadius = max(hoverRadius, toggleRadius);

    // Smooth mask: 1.0 inside aura reveal, 0.0 outside
    float revealMask = 1.0 - smoothstep(activeRadius - 0.025, activeRadius + 0.015, dist);

    // Glowing golden-yellow neon rim along the boundary (like rinlayheang.me reference)
    float edgeBand = smoothstep(activeRadius - 0.038, activeRadius - 0.006, dist)
                   * (1.0 - smoothstep(activeRadius - 0.006, activeRadius + 0.032, dist));

    // Also add an inner ring when SHOW AURA is toggled on so the golden aura frame stays visible
    vec2 centerFace = vec2(0.5, 0.54) * aspect;
    float faceDist = length((vUv - vec2(0.5, 0.54)) * vec2(1.25, 0.85)) + noiseVal * 0.85;
    float auraRing = uToggleMode * (
      smoothstep(0.31, 0.335, faceDist) * (1.0 - smoothstep(0.335, 0.365, faceDist))
    );

    float totalGlow = clamp(edgeBand * max(uHover, uToggleMode) * 2.2 + auraRing * 2.0, 0.0, 1.0);

    // Composite Base and Aura textures
    vec4 mixedPortrait = mix(baseCol, auraCol, revealMask);

    // Golden-yellow electric aura glow (#FFE14D -> #F59E0B)
    vec3 glowColor = mix(vec3(1.0, 0.76, 0.12), vec3(1.0, 0.96, 0.55), totalGlow);

    // Only show glow where either portrait has alpha or near its silhouette
    float silhouetteMask = clamp(max(baseCol.a, auraCol.a) * 1.35, 0.0, 1.0);
    vec3 finalRgb = mix(mixedPortrait.rgb, glowColor, totalGlow * silhouetteMask);
    float finalAlpha = max(mixedPortrait.a, totalGlow * silhouetteMask * 0.95);

    gl_FragColor = vec4(finalRgb, finalAlpha);
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

    const width = container.clientWidth || 520;
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
      uHover: { value: 0.0 },
      uToggleMode: { value: isAuraForcedRef.current ? 1.0 : 0.0 },
      uTime: { value: 0.0 },
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

    // Load both images and preprocess their studio background into transparent cutouts
    let disposed = false;
    const texWidth = 860;
    const texHeight = 1000;

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

        // Align Base portrait and Aura cyber-wolf statue so head & shoulders match
        const baseCutout = createCutoutCanvas(baseImg, texWidth, texHeight, 0.96, 0.0);
        const auraCutout = createCutoutCanvas(auraImg, texWidth, texHeight, 0.98, 0.0);

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

    // Spring-interpolated pointer state
    const targetMouse = { x: 0.5, y: 0.58 };
    const currentMouse = { x: 0.5, y: 0.58 };
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
      const w = container.clientWidth || 520;
      const h = container.clientHeight || 620;
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    let rafId = 0;
    const startTime = performance.now();

    const animate = (now: number) => {
      rafId = window.requestAnimationFrame(animate);

      const elapsed = (now - startTime) * 0.001;
      uniforms.uTime.value = isReducedMotion ? 0.0 : elapsed;

      // Smooth spring-like interpolation for cursor & hover transition
      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.14;
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.14;
      currentHover += (targetHover - currentHover) * 0.12;

      const targetToggle = isAuraForcedRef.current ? 1.0 : 0.0;
      currentToggle += (targetToggle - currentToggle) * 0.1;

      uniforms.uMouse.value.set(currentMouse.x, currentMouse.y);
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
      aria-label="Interactive 3D Shader Portrait of Aryo Ristiawan Machfudz — hover or click Show Aura to reveal Cyber-Wolf Aura"
      className="relative h-full w-full cursor-crosshair select-none drop-shadow-[0_18px_28px_rgba(10,17,32,0.22)]"
    />
  );
}
