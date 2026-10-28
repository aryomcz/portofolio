"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface InteractiveTopographyCanvasProps {
  readonly className?: string;
}

const TOPOGRAPHY_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const TOPOGRAPHY_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uMouseStrength;
  uniform float uScroll;
  uniform float uIsDark;

  // 2D Simplex Noise by Ian McEwan, Ashima Arts
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

  // Fractal Brownian Motion for rich organic topography
  float fbm(vec2 p) {
    float total = 0.0;
    float amp = 0.55;
    float freq = 1.0;
    for (int i = 0; i < 4; i++) {
      total += snoise(p * freq) * amp;
      freq *= 2.02;
      amp *= 0.48;
    }
    return total;
  }

  void main() {
    vec2 st = gl_FragCoord.xy / uResolution.xy;
    float aspect = uResolution.x / max(1.0, uResolution.y);
    vec2 uv = (st - 0.5) * vec2(aspect, 1.0);

    // Mouse interactive displacement ripple
    vec2 mouseUv = (uMouse - 0.5) * vec2(aspect, 1.0);
    float distToMouse = length(uv - mouseUv);
    float mouseWave = exp(-distToMouse * 3.8) * sin(distToMouse * 24.0 - uTime * 4.0) * 0.12 * uMouseStrength;

    // Organic elevation map with subtle scroll velocity
    vec2 p = uv * 1.8 + vec2(0.0, uScroll * 0.00035);
    p += mouseWave * 0.6;

    float elevation = fbm(p + vec2(uTime * 0.035, -uTime * 0.025));

    // Contour isoline quantization (Lando Norris topographic aesthetics)
    float contourBands = 14.0;
    float val = elevation * contourBands;
    float lineDist = abs(fract(val) - 0.5);
    float lineDeriv = fwidth(val);
    float line = 1.0 - smoothstep(0.0, lineDeriv * 1.25, lineDist - 0.015);

    // Accentuate primary ridge rings every 4th band
    float majorLine = 1.0 - smoothstep(0.0, lineDeriv * 1.8, abs(fract(val / 4.0) - 0.5) - 0.02);

    // Base contour color palette based on theme mode
    vec3 darkBase = vec3(0.08, 0.72, 0.65); // Cyber-teal
    vec3 darkAccent = vec3(0.83, 1.0, 0.0); // Neon-chartreuse (Lando Norris style)
    vec3 lightBase = vec3(0.05, 0.48, 0.52); // Deep teal
    vec3 lightAccent = vec3(0.12, 0.68, 0.45); // Emerald

    vec3 lineColor = uIsDark > 0.5 
      ? mix(darkBase, darkAccent, majorLine * 0.5)
      : mix(lightBase, lightAccent, majorLine * 0.4);

    float alpha = (line * 0.075 + majorLine * 0.055) * (uIsDark > 0.5 ? 0.95 : 0.75);

    // Mouse proximity highlight halo
    float hoverHalo = exp(-distToMouse * 2.5) * 0.04 * uMouseStrength;
    alpha += hoverHalo;

    if (alpha <= 0.002) {
      discard;
    }

    gl_FragColor = vec4(lineColor, clamp(alpha, 0.0, 0.22));
  }
`;

export function InteractiveTopographyCanvas({ className }: InteractiveTopographyCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isReducedMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

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
      antialias: false,
      powerPreference: "high-performance",
      precision: isSoftwareGl ? "mediump" : "highp",
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.pointerEvents = "none";
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const checkIsDark = (): boolean => {
      const themeAttr = document.documentElement.getAttribute("data-theme");
      if (themeAttr === "dark") return true;
      if (themeAttr === "light") return false;
      return document.documentElement.classList.contains("dark");
    };

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uMouseStrength: { value: 0.0 },
      uScroll: { value: window.scrollY },
      uIsDark: { value: checkIsDark() ? 1.0 : 0.0 },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: TOPOGRAPHY_VERTEX_SHADER,
      fragmentShader: TOPOGRAPHY_FRAGMENT_SHADER,
      uniforms,
      transparent: true,
      depthWrite: false,
    });

    const quad = new THREE.Mesh(geometry, material);
    scene.add(quad);

    // Spring mouse kinematics state
    const targetMouse = { x: 0.5, y: 0.5 };
    const currentMouse = { x: 0.5, y: 0.5 };
    let targetStrength = 0.0;
    let currentStrength = 0.0;
    let lastScrollY = window.scrollY;

    const handlePointerMove = (e: PointerEvent) => {
      targetMouse.x = e.clientX / Math.max(1, window.innerWidth);
      targetMouse.y = 1.0 - e.clientY / Math.max(1, window.innerHeight);
      targetStrength = 1.0;
    };

    const handlePointerLeave = () => {
      targetStrength = 0.0;
    };

    const handleScroll = () => {
      lastScrollY = window.scrollY;
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      renderer.setSize(width, height);
      uniforms.uResolution.value.set(width, height);
    };

    // Watch for theme changes (data-theme="dark" / "light")
    const themeObserver = new MutationObserver(() => {
      uniforms.uIsDark.value = checkIsDark() ? 1.0 : 0.0;
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    let rafId = 0;
    let isTabVisible = !document.hidden;
    const handleVisibility = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const startTime = performance.now();

    const renderLoop = (time: number) => {
      rafId = requestAnimationFrame(renderLoop);
      if (!isTabVisible) return;

      const elapsed = (time - startTime) * 0.001;
      uniforms.uTime.value = isReducedMotion ? 0.0 : elapsed;
      uniforms.uScroll.value = lastScrollY;

      // Spring-damped mouse tracking (frame-rate independent feel)
      const k = 0.12;
      currentMouse.x += (targetMouse.x - currentMouse.x) * k;
      currentMouse.y += (targetMouse.y - currentMouse.y) * k;
      currentStrength += (targetStrength - currentStrength) * 0.08;

      uniforms.uMouse.value.set(currentMouse.x, currentMouse.y);
      uniforms.uMouseStrength.value = isReducedMotion ? 0.0 : currentStrength;

      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(rafId);
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);

      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [isReducedMotion]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className ?? ""}`}
    />
  );
}
