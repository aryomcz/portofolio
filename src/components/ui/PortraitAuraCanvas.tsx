"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface PortraitAuraCanvasProps {
  readonly baseImageSrc: string;
  readonly auraImageSrc: string;
  readonly isAuraForced: boolean;
}

const TEX_WIDTH = 1240;
const TEX_HEIGHT = 1000;
const TEX_ASPECT = TEX_WIDTH / TEX_HEIGHT;
const TRAIL_LENGTH = 8;

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
  uniform vec2 uTrail[${TRAIL_LENGTH}];
  uniform vec2 uMouseParallax;
  uniform float uParallaxStrength;
  uniform float uHover;
  uniform float uToggleMode;
  uniform float uIntroAura;
  uniform float uIntroReveal;
  uniform float uTime;
  uniform float uContainerAspect;
  uniform float uTexAspect;
  uniform float uReady;

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

  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
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
    if (uReady < 0.5) {
      gl_FragColor = vec4(0.0);
      return;
    }

    vec2 uv = toTexUv(vUv);
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.0);
      return;
    }

    vec4 rawBase = texture2D(uBaseTex, uv);
    float globalAuraProgress = clamp(max(uIntroAura, uToggleMode), 0.0, 1.0);

    // FAST PATH 1: Normal resting portrait (no hover, no active aura dissolve)
    // Skips aura texture fetch, 8-node trail loop, and all 5 simplex noise calls!
    if (uHover <= 0.002 && globalAuraProgress <= 0.002) {
      if (rawBase.a <= 0.005) {
        gl_FragColor = vec4(0.0);
        return;
      }
      float edgeMaskFast = smoothstep(0.01, 0.45, rawBase.a);
      vec2 dFast = (uv - vec2(0.50, 0.55)) / vec2(0.26, 0.36);
      float cranialFast = sqrt(clamp(1.0 - dot(dFast, dFast), 0.0, 1.0));
      float lumFast = dot(rawBase.rgb, vec3(0.299, 0.587, 0.114));
      float noseFast = clamp(1.0 - length((uv - vec2(0.50, 0.54)) / vec2(0.06, 0.09)), 0.0, 1.0);
      float depthFast = (cranialFast * 0.65 + lumFast * 0.20 + noseFast * 0.15) * edgeMaskFast;
      vec2 dispFast = clamp(uv + uMouseParallax * depthFast * uParallaxStrength, 0.0, 1.0);
      vec4 baseFast = texture2D(uBaseTex, dispFast);
      baseFast.a = min(baseFast.a, rawBase.a);
      gl_FragColor = vec4(baseFast.rgb, baseFast.a * uIntroReveal);
      return;
    }

    vec4 rawAura = texture2D(uAuraTex, uv);
    float combinedRawAlpha = max(rawBase.a, rawAura.a);

    if (combinedRawAlpha <= 0.005 && uHover <= 0.005) {
      gl_FragColor = vec4(0.0);
      return;
    }

    float edgeMask = smoothstep(0.01, 0.45, combinedRawAlpha);
    vec2 headCenter = vec2(0.50, 0.55);
    vec2 d = (uv - headCenter) / vec2(0.26, 0.36);
    float cranial = sqrt(clamp(1.0 - dot(d, d), 0.0, 1.0));
    float lum = dot(rawBase.rgb, vec3(0.299, 0.587, 0.114));
    float nose = clamp(1.0 - length((uv - vec2(0.50, 0.54)) / vec2(0.06, 0.09)), 0.0, 1.0);
    float depth = (cranial * 0.65 + lum * 0.20 + nose * 0.15) * edgeMask;

    vec2 parallaxOffset = uMouseParallax * depth * uParallaxStrength;
    vec2 displacedUv = clamp(uv + parallaxOffset, 0.0, 1.0);

    vec4 baseCol = texture2D(uBaseTex, displacedUv);
    vec4 auraCol = texture2D(uAuraTex, displacedUv);

    baseCol.a = min(baseCol.a, rawBase.a);
    auraCol.a = min(auraCol.a, rawAura.a);
    float unionAlpha = max(baseCol.a, auraCol.a);

    // =========================================================================
    // 1. MULTI-NODE FLUID CURSOR TRAIL (Only evaluated when uHover > 0.002)
    // =========================================================================
    float lensMask = 0.0;
    float hoverCore = 0.0;
    float hoverHalo = 0.0;

    if (uHover > 0.002) {
      vec2 metric = vec2(uTexAspect * 1.05, 0.92);
      float baseRadius = 0.145 * uHover;
      float trailField = 10.0;
      for (int i = 0; i < ${TRAIL_LENGTH}; i++) {
        float fi = float(i) / float(${TRAIL_LENGTH - 1});
        vec2 nodeUv = toTexUv(uTrail[i]);
        float nodeRadius = baseRadius * mix(1.0, 0.38, fi);
        float nodeDist = length((displacedUv - nodeUv) * metric) - nodeRadius;
        trailField = (i == 0) ? nodeDist : smin(trailField, nodeDist, 0.055);
      }

      float n1 = snoise(uv * 4.8 + vec2(uTime * 0.55, -uTime * 0.42));
      float n2 = snoise(uv * 9.5 - vec2(uTime * 0.75, uTime * 0.60)) * 0.45;
      float cursorNoise = (n1 + n2) * 0.024 * uHover;
      float signedDist = trailField + cursorNoise;

      lensMask = uHover * (1.0 - smoothstep(-0.016, 0.016, signedDist));
      hoverCore = uHover * (1.0 - smoothstep(0.0, 0.011, abs(signedDist)));
      hoverHalo = uHover * (1.0 - smoothstep(0.0, 0.038, abs(signedDist)));
    }

    // =========================================================================
    // 2. ORGANIC NOISE BURN DISSOLVE (Only evaluated during active transition)
    // =========================================================================
    float globalAuraMask = globalAuraProgress >= 0.998 ? 1.0 : 0.0;
    float burnCore = 0.0;
    float burnHalo = 0.0;

    if (globalAuraProgress > 0.002 && globalAuraProgress < 0.998) {
      float fn1 = snoise(uv * 2.8 + vec2(0.12, -uTime * 0.10));
      float fn2 = snoise(uv * 5.8 - vec2(uTime * 0.14, 0.22)) * 0.50;
      float fn3 = snoise(uv * 11.5 + vec2(uTime * 0.20, uTime * 0.18)) * 0.25;
      float fbm = (fn1 + fn2 + fn3) / 1.75;
      float centerDist = length((uv - vec2(0.5, 0.45)) * vec2(1.0, 0.85));
      float dissolveField = clamp((fbm * 0.5 + 0.5) * 0.82 + centerDist * 0.18, 0.0, 1.0);

      float burnMargin = 0.09;
      float thresh = mix(-burnMargin, 1.0 + burnMargin, 1.0 - globalAuraProgress);
      globalAuraMask = smoothstep(thresh - 0.022, thresh + 0.022, dissolveField);

      float isTransitioning = smoothstep(0.0, 0.03, globalAuraProgress) * smoothstep(1.0, 0.97, globalAuraProgress);
      float burnDist = abs(dissolveField - thresh);
      burnCore = isTransitioning * (1.0 - smoothstep(0.0, 0.024, burnDist));
      burnHalo = isTransitioning * (1.0 - smoothstep(0.0, 0.085, burnDist));
    }

    // =========================================================================
    // 3. COMPOSITING BASE vs AURA + ELECTRIC ENERGY RIM
    // =========================================================================
    float targetHoverAura = mix(lensMask, 1.0 - lensMask, uToggleMode);
    float auraMix = mix(targetHoverAura, 1.0, uIntroAura > 0.001 ? globalAuraMask : 0.0);
    if (uIntroAura <= 0.001) {
      auraMix = mix(lensMask, 1.0 - lensMask, globalAuraMask);
    }
    auraMix = clamp(auraMix, 0.0, 1.0);

    float wBase = baseCol.a * (1.0 - auraMix);
    float wAura = auraCol.a * auraMix;
    float mixedAlpha = wBase + wAura;

    vec3 mixedRgb = (mixedAlpha > 0.0001)
      ? (baseCol.rgb * wBase + auraCol.rgb * wAura) / mixedAlpha
      : vec3(0.0);

    float silhouetteMask = smoothstep(0.005, 0.18, unionAlpha);
    float hoverGlow = clamp(hoverCore * 1.25 + hoverHalo * 0.58, 0.0, 1.0);
    float burnGlow = clamp((burnCore * 1.30 + burnHalo * 0.62) * silhouetteMask, 0.0, 1.0);
    float glowStrength = clamp(max(hoverGlow, burnGlow), 0.0, 1.0);
    float coreWeight = clamp(max(hoverCore, burnCore * silhouetteMask), 0.0, 1.0);

    // Electric-gold plasma rim with white-hot inner core (exact match to reference video)
    vec3 glowColor = mix(vec3(0.83, 1.0, 0.0), vec3(0.08, 0.95, 0.75), coreWeight);

    float outAlpha = clamp(mixedAlpha + glowStrength * (1.0 - mixedAlpha), 0.0, 1.0);
    vec3 outRgb = (outAlpha > 0.0001)
      ? (mixedRgb * mixedAlpha * (1.0 - glowStrength * 0.85) + glowColor * glowStrength) / outAlpha
      : vec3(0.0);

    gl_FragColor = vec4(outRgb, outAlpha * uIntroReveal);
  }
`;

function createCubicBezier(p1x: number, p1y: number, p2x: number, p2y: number) {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  function sampleCurveX(t: number) {
    return ((ax * t + bx) * t + cx) * t;
  }
  function sampleCurveY(t: number) {
    return ((ay * t + by) * t + cy) * t;
  }
  function solveCurveX(x: number) {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const xEst = sampleCurveX(t) - x;
      if (Math.abs(xEst) < 1e-4) return t;
      const dX = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(dX) < 1e-5) break;
      t -= xEst / dX;
    }
    return t;
  }

  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return sampleCurveY(solveCurveX(x));
  };
}

const easeDissolve = createCubicBezier(0.22, 1.0, 0.36, 1.0);

let _cachedSoftwareGl: boolean | null = null;
function isSoftwareWebGLCached(): boolean {
  if (_cachedSoftwareGl !== null) return _cachedSoftwareGl;
  if (typeof document === "undefined") return false;
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) {
      _cachedSoftwareGl = true;
      return true;
    }
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    _cachedSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return _cachedSoftwareGl;
  } catch {
    _cachedSoftwareGl = false;
    return false;
  }
}

export function PortraitAuraCanvas({
  baseImageSrc,
  auraImageSrc,
  isAuraForced,
}: PortraitAuraCanvasProps) {
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const wakeLoopRef = useRef<(() => void) | null>(null);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [isWebglReady, setIsWebglReady] = useState<boolean>(false);
  const isReducedMotion = useReducedMotion();
  const shouldInitWebgl = hasInteracted || isAuraForced;
  const isAuraForcedRef = useRef<boolean>(isAuraForced);
  const toggleAnimRef = useRef<{
    from: number;
    to: number;
    startTime: number;
  }>({
    from: isAuraForced ? 1.0 : 0.0,
    to: isAuraForced ? 1.0 : 0.0,
    startTime: 0,
  });

  useEffect(() => {
    const nextTarget = isAuraForced ? 1.0 : 0.0;
    if (toggleAnimRef.current.to !== nextTarget) {
      toggleAnimRef.current = {
        from: toggleAnimRef.current.to,
        to: nextTarget,
        startTime: performance.now(),
      };
      wakeLoopRef.current?.();
    }
    isAuraForcedRef.current = isAuraForced;
  }, [isAuraForced]);

  useEffect(() => {
    if (!shouldInitWebgl) return;
    const container = canvasHostRef.current;
    if (!container) return;

    let disposed = false;
    let cleanupWebgl: (() => void) | null = null;

    void import("three").then((THREE) => {
      if (disposed || !container) return;

      const width = container.clientWidth || 640;
      const height = container.clientHeight || 520;

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(
        -0.5,
        0.5,
        0.5,
        -0.5,
        0.1,
        10
      );
      camera.position.z = 1;

      const isSoftwareGl = isSoftwareWebGLCached();
      const isMobileViewport = window.innerWidth < 768;

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: false,
          powerPreference: "high-performance",
        });
      } catch {
        return;
      }

      renderer.setSize(width, height);
      renderer.setPixelRatio(
        isSoftwareGl || isMobileViewport ? 1 : Math.min(window.devicePixelRatio, 1.5)
      );
      container.innerHTML = "";
      container.appendChild(renderer.domElement);

      const initialTrail = Array.from(
        { length: TRAIL_LENGTH },
        () => new THREE.Vector2(0.5, 0.55)
      );

      const uniforms = {
        uBaseTex: { value: new THREE.Texture() },
        uAuraTex: { value: new THREE.Texture() },
        uTrail: { value: initialTrail },
        uMouseParallax: { value: new THREE.Vector2(0.0, 0.0) },
        uParallaxStrength: { value: 0.012 },
        uHover: { value: 0.0 },
        uToggleMode: { value: isAuraForcedRef.current ? 1.0 : 0.0 },
        uIntroAura: { value: isReducedMotion ? 0.0 : 1.0 },
        uIntroReveal: { value: 1.0 },
        uTime: { value: 0.0 },
        uContainerAspect: { value: width / Math.max(1, height) },
        uTexAspect: { value: TEX_ASPECT },
        uReady: { value: 0.0 },
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

      let texturesLoaded = false;
      const preloaderDone = true;
      let introStartTime: number | null = null;
      let rafId = 0;
      let isLoopActive = false;
      let isVisible = true;
      const mountTime = performance.now();

      const targetMouse = { x: 0.5, y: 0.58 };
      const trailNodes = Array.from({ length: TRAIL_LENGTH }, () => ({
        x: 0.5,
        y: 0.58,
      }));
      const currentParallax = { x: 0.0, y: 0.0 };
      let targetHover = 0.0;
      let currentHover = 0.0;

      const animate = (now: number) => {
        if (disposed || !isVisible || !texturesLoaded) {
          isLoopActive = false;
          return;
        }

        const totalElapsed = (now - mountTime) * 0.001;
        uniforms.uTime.value = isReducedMotion ? 0.0 : totalElapsed;

        let isIntroRunning = false;
        if (isReducedMotion || introStartTime === null) {
          uniforms.uIntroReveal.value = 1.0;
          uniforms.uIntroAura.value = 0.0;
        } else {
          const introElapsed = (now - introStartTime) * 0.001;
          uniforms.uIntroReveal.value = 1.0;

          if (introElapsed < 0.45) {
            uniforms.uIntroAura.value = 1.0;
            isIntroRunning = true;
          } else if (introElapsed < 1.35) {
            const rawProgress = (introElapsed - 0.45) / 0.9;
            const easedProgress = easeDissolve(rawProgress);
            uniforms.uIntroAura.value = 1.0 - easedProgress;
            isIntroRunning = true;
          } else {
            uniforms.uIntroAura.value = 0.0;
          }
        }

        let isToggleRunning = false;
        const toggleAnim = toggleAnimRef.current;
        if (isReducedMotion || toggleAnim.startTime === 0) {
          uniforms.uToggleMode.value = toggleAnim.to;
        } else {
          const toggleElapsed = (now - toggleAnim.startTime) * 0.001;
          if (toggleElapsed < 0.85) {
            const t = easeDissolve(toggleElapsed / 0.85);
            uniforms.uToggleMode.value =
              toggleAnim.from + (toggleAnim.to - toggleAnim.from) * t;
            isToggleRunning = true;
          } else {
            uniforms.uToggleMode.value = toggleAnim.to;
          }
        }

        trailNodes[0].x += (targetMouse.x - trailNodes[0].x) * 0.22;
        trailNodes[0].y += (targetMouse.y - trailNodes[0].y) * 0.22;
        uniforms.uTrail.value[0].set(trailNodes[0].x, trailNodes[0].y);

        for (let i = 1; i < TRAIL_LENGTH; i++) {
          const prev = trailNodes[i - 1];
          const curr = trailNodes[i];
          curr.x += (prev.x - curr.x) * 0.28;
          curr.y += (prev.y - curr.y) * 0.28;
          uniforms.uTrail.value[i].set(curr.x, curr.y);
        }

        currentHover += (targetHover - currentHover) * 0.16;
        if (currentHover < 0.001 && targetHover === 0) {
          currentHover = 0;
        }
        uniforms.uHover.value = currentHover;

        const targetParallaxX = targetMouse.x - 0.5;
        const targetParallaxY = targetMouse.y - 0.55;
        currentParallax.x += (targetParallaxX - currentParallax.x) * 0.09;
        currentParallax.y += (targetParallaxY - currentParallax.y) * 0.09;

        uniforms.uMouseParallax.value.set(
          isReducedMotion ? 0.0 : currentParallax.x,
          isReducedMotion ? 0.0 : currentParallax.y
        );
        uniforms.uParallaxStrength.value = isReducedMotion ? 0.0 : 0.012;

        if (!isReducedMotion) {
          mesh.rotation.y = currentParallax.x * 0.08;
          mesh.rotation.x = -currentParallax.y * 0.06;
        }

        renderer.render(scene, camera);

        const parallaxDelta = Math.hypot(
          targetParallaxX - currentParallax.x,
          targetParallaxY - currentParallax.y
        );
        const needsNextFrame =
          isIntroRunning ||
          isToggleRunning ||
          currentHover > 0.001 ||
          targetHover > 0.001 ||
          parallaxDelta > 0.0006;

        if (needsNextFrame) {
          rafId = window.requestAnimationFrame(animate);
        } else {
          isLoopActive = false;
        }
      };

      const wakeLoop = () => {
        if (!isLoopActive && !disposed && isVisible && texturesLoaded) {
          isLoopActive = true;
          rafId = window.requestAnimationFrame(animate);
        }
      };
      wakeLoopRef.current = wakeLoop;

      const tryStartIntro = () => {
        if (texturesLoaded && preloaderDone && introStartTime === null) {
          introStartTime = performance.now();
          wakeLoop();
        }
      };

      const textureLoader = new THREE.TextureLoader();
      const loadTex = (src: string): Promise<THREE.Texture> =>
        new Promise((resolve, reject) => {
          textureLoader.load(src, resolve, undefined, reject);
        });

      Promise.all([loadTex(baseImageSrc), loadTex(auraImageSrc)])
        .then(([baseTex, auraTex]) => {
          if (disposed) {
            baseTex.dispose();
            auraTex.dispose();
            return;
          }
          baseTex.colorSpace = THREE.NoColorSpace;
          baseTex.minFilter = THREE.LinearFilter;
          baseTex.magFilter = THREE.LinearFilter;
          baseTex.generateMipmaps = false;

          auraTex.colorSpace = THREE.SRGBColorSpace;
          auraTex.minFilter = THREE.LinearFilter;
          auraTex.magFilter = THREE.LinearFilter;
          auraTex.generateMipmaps = false;

          uniforms.uBaseTex.value.dispose();
          uniforms.uAuraTex.value.dispose();
          uniforms.uBaseTex.value = baseTex;
          uniforms.uAuraTex.value = auraTex;
          uniforms.uReady.value = 1.0;

          texturesLoaded = true;
          tryStartIntro();
          renderer.render(scene, camera);
          setIsWebglReady(true);
        })
        .catch(() => {
          // Keep SSR priority Image visible if WebGL texture load fails
        });

      const handlePointerMove = (e: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / Math.max(1, rect.width);
        const ny = 1.0 - (e.clientY - rect.top) / Math.max(1, rect.height);
        targetMouse.x = Math.max(0.0, Math.min(1.0, nx));
        targetMouse.y = Math.max(0.0, Math.min(1.0, ny));

        if (currentHover < 0.02) {
          for (let i = 0; i < TRAIL_LENGTH; i++) {
            trailNodes[i].x = targetMouse.x;
            trailNodes[i].y = targetMouse.y;
          }
        }

        if (nx >= 0.08 && nx <= 0.92 && ny >= 0.02 && ny <= 0.95) {
          targetHover = 1.0;
        } else {
          targetHover = 0.0;
        }
        wakeLoop();
      };

      const handlePointerLeave = () => {
        targetHover = 0.0;
        targetMouse.x = 0.5;
        targetMouse.y = 0.55;
        wakeLoop();
      };

      container.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });
      container.addEventListener("pointerleave", handlePointerLeave, {
        passive: true,
      });

      const handleResize = () => {
        if (!container) return;
        const w = container.clientWidth || 640;
        const h = container.clientHeight || 520;
        renderer.setSize(w, h);
        uniforms.uContainerAspect.value = w / Math.max(1, h);
        wakeLoop();
      };

      window.addEventListener("resize", handleResize, { passive: true });

      const visibilityObserver = new IntersectionObserver(
        ([entry]) => {
          const nextVis = entry?.isIntersecting ?? false;
          isVisible = nextVis;
          if (nextVis) {
            wakeLoop();
          }
        },
        { threshold: 0 }
      );
      visibilityObserver.observe(container);

      cleanupWebgl = () => {
        visibilityObserver.disconnect();
        window.cancelAnimationFrame(rafId);
        window.removeEventListener("resize", handleResize);
        container.removeEventListener("pointermove", handlePointerMove);
        container.removeEventListener("pointerleave", handlePointerLeave);
        geometry.dispose();
        material.dispose();
        uniforms.uBaseTex.value.dispose();
        uniforms.uAuraTex.value.dispose();
        renderer.dispose();
        if (renderer.domElement.parentElement) {
          renderer.domElement.parentElement.removeChild(renderer.domElement);
        }
      };
    });

    return () => {
      disposed = true;
      wakeLoopRef.current = null;
      cleanupWebgl?.();
    };
  }, [shouldInitWebgl, baseImageSrc, auraImageSrc, isReducedMotion]);

  return (
    <div
      aria-label="Interactive 3D Shader Portrait of Aryo Ristiawan Machfudz — hover or click Show Aura to switch between Normal Portrait and Cyber-Wolf Aura"
      onPointerEnter={() => setHasInteracted(true)}
      onPointerDown={() => setHasInteracted(true)}
      className="relative h-full w-full cursor-default select-none drop-shadow-[0_18px_28px_rgba(10,17,32,0.22)]"
    >
      {/* Instant SSR / LCP Priority Portrait Layer (Zero JS Blocking, 38KB WebP) */}
      <Image
        src={baseImageSrc}
        alt="Aryo Ristiawan Machfudz — Full-Stack Developer & System Analyst"
        fill
        priority
        fetchPriority="high"
        sizes="(max-width: 768px) 90vw, 480px"
        referrerPolicy="no-referrer"
        className={`pointer-events-none object-contain object-bottom transition-opacity duration-200 ${
          isWebglReady ? "opacity-0" : "opacity-100"
        }`}
      />
      {/* Interactive WebGL Shader Canvas Host */}
      <div ref={canvasHostRef} className="relative z-10 h-full w-full" />
    </div>
  );
}
