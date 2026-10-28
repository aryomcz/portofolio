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

  // Smooth minimum (polynomial smin) for fluid metaball trail fusion
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

    // Sample undisplaced base & aura to lock silhouette boundaries (zero ghosting while preserving full Cyber-Wolf)
    vec4 rawBase = texture2D(uBaseTex, uv);
    vec4 rawAura = texture2D(uAuraTex, uv);
    float combinedRawAlpha = max(rawBase.a, rawAura.a);

    // If completely outside portrait/wolf silhouette AND cursor hover is inactive, skip work early
    if (combinedRawAlpha <= 0.005 && uHover <= 0.005) {
      gl_FragColor = vec4(0.0);
      return;
    }

    // Boundary feather: strictly fades 3D parallax to 0 at silhouette edges so no double image ever appears
    float edgeMask = smoothstep(0.01, 0.45, combinedRawAlpha);

    // Anatomical convex cranial & torso depth profile (3D effect preserved)
    vec2 headCenter = vec2(0.50, 0.55);
    vec2 d = (uv - headCenter) / vec2(0.26, 0.36);
    float cranial = sqrt(clamp(1.0 - dot(d, d), 0.0, 1.0));
    float lum = dot(rawBase.rgb, vec3(0.299, 0.587, 0.114));
    float nose = clamp(1.0 - length((uv - vec2(0.50, 0.54)) / vec2(0.06, 0.09)), 0.0, 1.0);

    float depth = (cranial * 0.65 + lum * 0.20 + nose * 0.15) * edgeMask;

    // Smooth, calibrated 3D parallax displacement shared identically between Base and Aura
    vec2 parallaxOffset = uMouseParallax * depth * uParallaxStrength;
    vec2 displacedUv = clamp(uv + parallaxOffset, 0.0, 1.0);

    vec4 baseCol = texture2D(uBaseTex, displacedUv);
    vec4 auraCol = texture2D(uAuraTex, displacedUv);

    // Lock each layer's alpha to its own undisplaced silhouette to eliminate double edges while keeping Cyber-Wolf intact
    baseCol.a = min(baseCol.a, rawBase.a);
    auraCol.a = min(auraCol.a, rawAura.a);

    float unionAlpha = max(baseCol.a, auraCol.a);

    // =========================================================================
    // 1. MULTI-NODE FLUID CURSOR TRAIL (Matches rinlayheang.me ribbon stroke)
    // =========================================================================
    vec2 metric = vec2(uTexAspect * 1.05, 0.92);
    float baseRadius = 0.145 * uHover;

    // Evaluate distance field to the 8-node spring trail chain using smooth minimum (smin)
    float trailField = 10.0;
    for (int i = 0; i < ${TRAIL_LENGTH}; i++) {
      float fi = float(i) / float(${TRAIL_LENGTH - 1});
      vec2 nodeUv = toTexUv(uTrail[i]);
      // Tapering radius from cursor head (1.0) to tail (0.38)
      float nodeRadius = baseRadius * mix(1.0, 0.38, fi);
      float nodeDist = length((displacedUv - nodeUv) * metric) - nodeRadius;
      trailField = (i == 0) ? nodeDist : smin(trailField, nodeDist, 0.055);
    }

    // Multi-layered animated simplex noise for organic liquid boundary ripple
    float n1 = snoise(uv * 4.8 + vec2(uTime * 0.55, -uTime * 0.42));
    float n2 = snoise(uv * 9.5 - vec2(uTime * 0.75, uTime * 0.60)) * 0.45;
    float cursorNoise = (n1 + n2) * 0.024 * uHover;

    // Signed distance to cursor liquid blob boundary (< 0 is inside blob, > 0 is outside)
    float signedDist = trailField + cursorNoise;

    // Smooth hover lens mask: 1.0 inside liquid trail, 0.0 outside
    float lensMask = uHover * (1.0 - smoothstep(-0.016, 0.016, signedDist));

    // Glowing energy rim around the cursor liquid trail
    float hoverCore = uHover * (1.0 - smoothstep(0.0, 0.011, abs(signedDist)));
    float hoverHalo = uHover * (1.0 - smoothstep(0.0, 0.038, abs(signedDist)));

    // =========================================================================
    // 2. ORGANIC NOISE BURN DISSOLVE (Intro Animation & Show Aura Switch)
    // =========================================================================
    // Multi-octave FBM noise field in [0.0, 1.0] for island/patch dissolve
    float fn1 = snoise(uv * 2.8 + vec2(0.12, -uTime * 0.10));
    float fn2 = snoise(uv * 5.8 - vec2(uTime * 0.14, 0.22)) * 0.50;
    float fn3 = snoise(uv * 11.5 + vec2(uTime * 0.20, uTime * 0.18)) * 0.25;
    float fbm = (fn1 + fn2 + fn3) / 1.75;
    // Slight vertical/center bias so chest & face break through organically like the reference video
    float centerDist = length((uv - vec2(0.5, 0.45)) * vec2(1.0, 0.85));
    float dissolveField = clamp((fbm * 0.5 + 0.5) * 0.82 + centerDist * 0.18, 0.0, 1.0);

    // Combined global Aura level from Intro Animation (1 -> 0) and Manual Toggle (0 <-> 1)
    float globalAuraProgress = clamp(max(uIntroAura, uToggleMode), 0.0, 1.0);

    // Map globalAuraProgress (1.0 = full Aura, 0.0 = full Base) to noise threshold
    float burnMargin = 0.09;
    float thresh = mix(-burnMargin, 1.0 + burnMargin, 1.0 - globalAuraProgress);

    // Pixels where dissolveField > thresh remain Aura; < thresh become Base
    float globalAuraMask = smoothstep(thresh - 0.022, thresh + 0.022, dissolveField);

    // Active burn rim along the eroding noise boundary during Intro or Toggle transition
    float isTransitioning = smoothstep(0.0, 0.03, globalAuraProgress) * smoothstep(1.0, 0.97, globalAuraProgress);
    float burnDist = abs(dissolveField - thresh);
    float burnCore = isTransitioning * (1.0 - smoothstep(0.0, 0.024, burnDist));
    float burnHalo = isTransitioning * (1.0 - smoothstep(0.0, 0.085, burnDist));

    // =========================================================================
    // 3. COMPOSITING BASE vs AURA + ELECTRIC ENERGY RIM
    // =========================================================================
    // When globalAuraMask is 0 (normal state), lensMask reveals Aura (1).
    // When globalAuraMask is 1 (Aura state), lensMask reveals Base (0) when toggled, or stays 1 during intro.
    float targetHoverAura = mix(lensMask, 1.0 - lensMask, uToggleMode);
    float auraMix = mix(targetHoverAura, 1.0, uIntroAura > 0.001 ? globalAuraMask : 0.0);
    if (uIntroAura <= 0.001) {
      auraMix = mix(lensMask, 1.0 - lensMask, globalAuraMask);
    }
    auraMix = clamp(auraMix, 0.0, 1.0);

    // Premultiplied alpha compositing so transparent background around Cyber-Wolf never bleeds dark RGB
    float wBase = baseCol.a * (1.0 - auraMix);
    float wAura = auraCol.a * auraMix;
    float mixedAlpha = wBase + wAura;

    vec3 mixedRgb = (mixedAlpha > 0.0001)
      ? (baseCol.rgb * wBase + auraCol.rgb * wAura) / mixedAlpha
      : vec3(0.0);

    // Combine Cursor Rim (continuous closed liquid contour) + Intro/Toggle Dissolve Burn Rim (clipped to portrait & Cyber-Wolf silhouette)
    float silhouetteMask = smoothstep(0.005, 0.18, unionAlpha);
    float hoverGlow = clamp(hoverCore * 1.25 + hoverHalo * 0.58, 0.0, 1.0);
    float burnGlow = clamp((burnCore * 1.30 + burnHalo * 0.62) * silhouetteMask, 0.0, 1.0);
    float glowStrength = clamp(max(hoverGlow, burnGlow), 0.0, 1.0);
    float coreWeight = clamp(max(hoverCore, burnCore * silhouetteMask), 0.0, 1.0);

    // Electric-gold plasma rim with white-hot inner core (exact match to reference video)
    vec3 glowColor = mix(vec3(0.83, 1.0, 0.0), vec3(0.08, 0.95, 0.75), coreWeight);


    // Alpha-over compositing for the glowing rim
    float outAlpha = clamp(mixedAlpha + glowStrength * (1.0 - mixedAlpha), 0.0, 1.0);
    vec3 outRgb = (outAlpha > 0.0001)
      ? (mixedRgb * mixedAlpha * (1.0 - glowStrength * 0.85) + glowColor * glowStrength) / outAlpha
      : vec3(0.0);

    // Apply smooth intro entrance fade-in
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

    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement("canvas").getContext("webgl2");
        if (!gl) return true;
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isSoftwareGl,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
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
      uIntroReveal: { value: isReducedMotion ? 1.0 : 0.0 },
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
    let texturesLoaded = false;
    let preloaderDone = false;
    let introStartTime: number | null = null;

    // Check if Preloader has already finished in this session
    try {
      if (window.sessionStorage.getItem("aryo_hud_preloader_seen") === "true") {
        preloaderDone = true;
      }
    } catch {
      preloaderDone = true;
    }

    const tryStartIntro = () => {
      if (texturesLoaded && preloaderDone && introStartTime === null) {
        introStartTime = performance.now();
      }
    };

    const handlePreloaderComplete = () => {
      preloaderDone = true;
      tryStartIntro();
    };

    window.addEventListener("hud:preloader-complete", handlePreloaderComplete);

    // Fallback in case event fired just before listener attached
    const fallbackIntroTimer = window.setTimeout(() => {
      preloaderDone = true;
      tryStartIntro();
    }, 1250);

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
      })
      .catch(() => {
        // Fallback if image load fails
      });

    // 8-node spring chain for fluid ribbon cursor trail
    const targetMouse = { x: 0.5, y: 0.58 };
    const trailNodes = Array.from({ length: TRAIL_LENGTH }, () => ({
      x: 0.5,
      y: 0.58,
    }));
    const currentParallax = { x: 0.0, y: 0.0 };
    let targetHover = 0.0;
    let currentHover = 0.0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / Math.max(1, rect.width);
      const ny = 1.0 - (e.clientY - rect.top) / Math.max(1, rect.height);
      targetMouse.x = Math.max(0.0, Math.min(1.0, nx));
      targetMouse.y = Math.max(0.0, Math.min(1.0, ny));

      // Snap trail nodes to entry point when entering from cold state so no streak jumps across screen
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

    let isVisible = true;
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry?.isIntersecting ?? false;
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(container);

    let rafId = 0;
    const mountTime = performance.now();

    const animate = (now: number) => {
      rafId = window.requestAnimationFrame(animate);

      if (!isVisible) return;

      const totalElapsed = (now - mountTime) * 0.001;
      uniforms.uTime.value = isReducedMotion ? 0.0 : totalElapsed;

      // Choreographed Intro Sequence (Matches rinlayheang.me video):
      // 0.00s - 0.40s: Full Metallic Cyber-Wolf Aura fades in smoothly
      // 0.40s - 0.85s: Full Aura holds clearly
      // 0.85s - 1.95s: Organic Simplex Noise Burn Dissolve with blazing gold rim reveals Base portrait
      if (isReducedMotion) {
        uniforms.uIntroReveal.value = 1.0;
        uniforms.uIntroAura.value = 0.0;
      } else if (introStartTime === null) {
        uniforms.uIntroReveal.value = 0.0;
        uniforms.uIntroAura.value = 1.0;
      } else {
        const introElapsed = (now - introStartTime) * 0.001;

        // 1. Entrance fade-in (0.0s -> 0.40s)
        if (introElapsed < 0.4) {
          uniforms.uIntroReveal.value = easeDissolve(introElapsed / 0.4);
        } else {
          uniforms.uIntroReveal.value = 1.0;
        }

        // 2. Aura hold (0.0s -> 0.85s) then Organic Noise Burn Dissolve (0.85s -> 1.95s)
        if (introElapsed < 1.1) {
          uniforms.uIntroAura.value = 1.0;
        } else if (introElapsed < 2.1) {
          const rawProgress = (introElapsed - 1.1) / 1.35;
          const easedProgress = easeDissolve(rawProgress);
          uniforms.uIntroAura.value = 1.0 - easedProgress;
        } else {
          uniforms.uIntroAura.value = 0.0;
        }
      }

      // Smooth manual toggle transition ("SHOW AURA") using the same 0.95s organic burn curve
      const toggleAnim = toggleAnimRef.current;
      if (isReducedMotion || toggleAnim.startTime === 0) {
        uniforms.uToggleMode.value = toggleAnim.to;
      } else {
        const toggleElapsed = (now - toggleAnim.startTime) * 0.001;
        if (toggleElapsed < 0.95) {
          const t = easeDissolve(toggleElapsed / 0.95);
          uniforms.uToggleMode.value =
            toggleAnim.from + (toggleAnim.to - toggleAnim.from) * t;
        } else {
          uniforms.uToggleMode.value = toggleAnim.to;
        }
      }

      // Update 8-node spring chain for fluid liquid cursor trail
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

      currentHover += (targetHover - currentHover) * 0.14;
      uniforms.uHover.value = currentHover;

      // 3D Depth Map Parallax vector with buttery spring damping (Preserved unchanged)
      const targetParallaxX = targetMouse.x - 0.5;
      const targetParallaxY = targetMouse.y - 0.55;
      currentParallax.x += (targetParallaxX - currentParallax.x) * 0.07;
      currentParallax.y += (targetParallaxY - currentParallax.y) * 0.07;

      uniforms.uMouseParallax.value.set(
        isReducedMotion ? 0.0 : currentParallax.x,
        isReducedMotion ? 0.0 : currentParallax.y
      );
      uniforms.uParallaxStrength.value = isReducedMotion ? 0.0 : 0.012;

      // Subtle 3D physical perspective tilt on portrait mesh
      if (!isReducedMotion) {
        mesh.rotation.y = currentParallax.x * 0.08;
        mesh.rotation.x = -currentParallax.y * 0.06;
      }

      renderer.render(scene, camera);
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      disposed = true;
      window.clearTimeout(fallbackIntroTimer);
      window.removeEventListener("hud:preloader-complete", handlePreloaderComplete);
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
  }, [baseImageSrc, auraImageSrc, isReducedMotion]);

  return (
    <div
      ref={containerRef}
      aria-label="Interactive 3D Shader Portrait of Aryo Ristiawan Machfudz — hover or click Show Aura to switch between Normal Portrait and Cyber-Wolf Aura"
      className="relative h-full w-full cursor-default select-none drop-shadow-[0_18px_28px_rgba(10,17,32,0.22)]"
    />
  );
}
