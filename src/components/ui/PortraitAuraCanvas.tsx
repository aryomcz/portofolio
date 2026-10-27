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
  uniform float uIntroAura;
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

    // Smooth manual toggle mode with zero-endpoint organic dispersion envelope
    float toggleEnvelope = 4.0 * uToggleMode * (1.0 - uToggleMode);
    float toggleNoise = snoise(uv * 6.5 + vec2(uTime * 0.25, -uTime * 0.25)) * 0.12 * toggleEnvelope;
    float smoothToggle = clamp(uToggleMode + toggleNoise, 0.0, 1.0);

    // - Normal Mode (smoothToggle = 0.0): default is Base (0.0), hovering reveals Aura (1.0)
    // - Switched Mode (smoothToggle = 1.0): default is Aura (1.0), hovering reveals Base (0.0)
    float baseAuraMix = mix(lensMask, 1.0 - lensMask, smoothToggle);

    // Initial 0.5s Aura hold -> 0.8s dispersion dissolve into high-res portrait underneath.
    // Envelope 4*x*(1-x) guarantees introFade is strictly 1.0 at start and strictly 0.0 at end.
    float introEnvelope = 4.0 * uIntroAura * (1.0 - uIntroAura);
    float dissolveNoise = snoise(uv * 6.5 + vec2(uTime * 0.25, -uTime * 0.25)) * 0.14 * introEnvelope;
    float introFade = clamp(uIntroAura + dissolveNoise, 0.0, 1.0);

    float auraMix = clamp(max(baseAuraMix, introFade), 0.0, 1.0);

    // Premultiplied alpha compositing so transparent pixels NEVER bleed background RGB
    float wBase = baseCol.a * (1.0 - auraMix);
    float wAura = auraCol.a * auraMix;
    float mixedAlpha = wBase + wAura;

    if (mixedAlpha < 0.005) {
      gl_FragColor = vec4(0.0);
      return;
    }

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

    // Alpha-over compositing for the neon rim
    float outAlpha = mixedAlpha + glowAlpha * (1.0 - mixedAlpha);
    vec3 outRgb = (mixedRgb * mixedAlpha * (1.0 - glowAlpha) + glowColor * glowAlpha) / max(outAlpha, 0.0001);

    gl_FragColor = vec4(outRgb, outAlpha);
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

const easeDissolve = createCubicBezier(0.16, 1.0, 0.3, 1.0);

export function PortraitAuraCanvas({
  baseImageSrc,
  auraImageSrc,
  isAuraForced,
}: PortraitAuraCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isReducedMotion = useReducedMotion();
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
    }
    isAuraForcedRef.current = isAuraForced;
  }, [isAuraForced]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 520;

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
      uIntroAura: { value: isReducedMotion ? 0.0 : 1.0 },
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

    let disposed = false;
    let introStartTime: number | null = null;

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

        // Start the 500ms Aura hold timer ONLY once both textures are ready on GPU
        introStartTime = performance.now();
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

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / Math.max(1, rect.width);
      const ny = 1.0 - (e.clientY - rect.top) / Math.max(1, rect.height);
      targetMouse.x = Math.max(0.0, Math.min(1.0, nx));
      targetMouse.y = Math.max(0.0, Math.min(1.0, ny));

      // Gate hover lens to the central silhouette area so moving cursor up to the navbar never leaves a stray rim
      if (nx >= 0.14 && nx <= 0.86 && ny >= 0.02 && ny <= 0.92) {
        targetHover = 1.0;
      } else {
        targetHover = 0.0;
      }
    };

    const handlePointerLeave = () => {
      targetHover = 0.0;
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 520;
      renderer.setSize(w, h);
      uniforms.uContainerAspect.value = w / Math.max(1, h);
    };

    window.addEventListener("resize", handleResize);

    let rafId = 0;
    const mountTime = performance.now();

    const animate = (now: number) => {
      rafId = window.requestAnimationFrame(animate);

      const totalElapsed = (now - mountTime) * 0.001;
      uniforms.uTime.value = isReducedMotion ? 0.0 : totalElapsed;

      // 0.5s full metallic Aura hold -> 0.8s smooth dissolve via cubic-bezier(0.16, 1, 0.3, 1)
      if (isReducedMotion) {
        uniforms.uIntroAura.value = 0.0;
      } else if (introStartTime === null) {
        uniforms.uIntroAura.value = 1.0;
      } else {
        const introElapsed = (now - introStartTime) * 0.001;
        if (introElapsed < 0.5) {
          uniforms.uIntroAura.value = 1.0;
        } else if (introElapsed < 1.3) {
          const rawProgress = (introElapsed - 0.5) / 0.8;
          const easedProgress = easeDissolve(rawProgress);
          uniforms.uIntroAura.value = 1.0 - easedProgress;
        } else {
          uniforms.uIntroAura.value = 0.0;
        }
      }

      // Smooth manual toggle transition using the same 0.8s cubic-bezier(0.16, 1, 0.3, 1) curve
      const toggleAnim = toggleAnimRef.current;
      if (isReducedMotion || toggleAnim.startTime === 0) {
        uniforms.uToggleMode.value = toggleAnim.to;
      } else {
        const toggleElapsed = (now - toggleAnim.startTime) * 0.001;
        if (toggleElapsed < 0.8) {
          const t = easeDissolve(toggleElapsed / 0.8);
          uniforms.uToggleMode.value =
            toggleAnim.from + (toggleAnim.to - toggleAnim.from) * t;
        } else {
          uniforms.uToggleMode.value = toggleAnim.to;
        }
      }

      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.16;
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.16;
      trailMouse.x += (currentMouse.x - trailMouse.x) * 0.075;
      trailMouse.y += (currentMouse.y - trailMouse.y) * 0.075;
      currentHover += (targetHover - currentHover) * 0.14;

      uniforms.uMouse.value.set(currentMouse.x, currentMouse.y);
      uniforms.uTrailMouse.value.set(trailMouse.x, trailMouse.y);
      uniforms.uHover.value = currentHover;

      renderer.render(scene, camera);
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      disposed = true;
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
  }, [baseImageSrc, auraImageSrc, isReducedMotion]);

  return (
    <div
      ref={containerRef}
      aria-label="Interactive 3D Shader Portrait of Aryo Ristiawan Machfudz — hover or click Show Aura to switch between Normal Portrait and Cyber-Wolf Aura"
      className="relative h-full w-full cursor-crosshair select-none drop-shadow-[0_18px_28px_rgba(10,17,32,0.22)]"
    />
  );
}
