"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  useScrollCamera,
  getGlobalScrollCameraState,
} from "@/hooks/useScrollCamera";
import { MAIN_PAGE_SECTIONS } from "@/lib/scrollNavigation";

interface InteractiveTopographyCanvasProps {
  readonly className?: string;
}

const TOPOGRAPHY_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.999, 1.0);
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
  uniform vec3 uCamOffset;

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

    // Organic elevation map shifted by 3D scroll camera trajectory
    vec2 p = uv * 1.8 + vec2(uCamOffset.x * 0.18, uScroll * 0.00035 + uCamOffset.y * 0.18);
    p += mouseWave * 0.6;

    float elevation = fbm(p + vec2(uTime * 0.035, -uTime * 0.025));

    // Contour isoline quantization
    float contourBands = 14.0;
    float val = elevation * contourBands;
    float lineDist = abs(fract(val) - 0.5);
    float lineDeriv = fwidth(val);
    float line = 1.0 - smoothstep(0.0, lineDeriv * 1.25, lineDist - 0.015);

    // Accentuate primary ridge rings every 4th band
    float majorLine = 1.0 - smoothstep(0.0, lineDeriv * 1.8, abs(fract(val / 4.0) - 0.5) - 0.02);

    vec3 darkBase = vec3(0.08, 0.72, 0.65);
    vec3 darkAccent = vec3(0.055, 0.486, 0.525);
    vec3 lightBase = vec3(0.05, 0.48, 0.52);
    vec3 lightAccent = vec3(0.055, 0.486, 0.525);

    vec3 lineColor = uIsDark > 0.5 
      ? mix(darkBase, darkAccent, majorLine * 0.5)
      : mix(lightBase, lightAccent, majorLine * 0.4);

    float alpha = (line * 0.075 + majorLine * 0.055) * (uIsDark > 0.5 ? 0.95 : 0.75);

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
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const isReducedMotion = useReducedMotion();

  // Bind global Three.js camera to GSAP + Lenis scroll progress via useScrollCamera
  useScrollCamera({ cameraRef });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      width / Math.max(1, height),
      0.1,
      100
    );
    const initialState = getGlobalScrollCameraState();
    camera.position.set(...initialState.pose.position);
    camera.rotation.set(...initialState.pose.rotation);
    cameraRef.current = camera;

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
      uCamOffset: { value: new THREE.Vector3(0, 0, 6) },
    };

    // 1. Background Topographic Shader Quad (Clips in NDC space)
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: TOPOGRAPHY_VERTEX_SHADER,
      fragmentShader: TOPOGRAPHY_FRAGMENT_SHADER,
      uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    const quad = new THREE.Mesh(geometry, material);
    quad.frustumCulled = false;
    quad.renderOrder = -1;
    scene.add(quad);

    // 2. 3D Spatial Telemetry Field (Perspective objects traversed by useScrollCamera)
    const spatialGroup = new THREE.Group();
    scene.add(spatialGroup);

    const ringGeo = new THREE.RingGeometry(1.6, 1.615, 48);
    const nodeGeo = new THREE.OctahedronGeometry(0.08, 0);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x0e7c86,
      transparent: true,
      opacity: 0.09,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const nodeMat = new THREE.MeshBasicMaterial({
      color: 0x14b8a6,
      wireframe: true,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });

    MAIN_PAGE_SECTIONS.forEach((sec, idx) => {
      const anchorGroup = new THREE.Group();
      anchorGroup.position.set(
        sec.cameraPosition[0] * 0.75,
        sec.cameraPosition[1] * 0.75,
        (idx - 3) * -0.65
      );
      anchorGroup.rotation.set(
        idx * 0.22,
        idx * -0.18,
        sec.cameraRotation[2]
      );

      const ringMesh = new THREE.Mesh(ringGeo, wireMat);
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(1.6, 0, 0);

      anchorGroup.add(ringMesh);
      anchorGroup.add(nodeMesh);
      spatialGroup.add(anchorGroup);
    });

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
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      uniforms.uResolution.value.set(width, height);
    };

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
    let timeoutId = 0;
    let isDisposed = false;
    let isTabVisible = !document.hidden;
    const handleVisibility = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const startTime = performance.now();

    function afterDraw(cb: () => void) {
      if (isDisposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext | null;
      if (!gl || typeof gl.fenceSync !== "function") {
        timeoutId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          timeoutId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          timeoutId = window.setTimeout(cb, 80);
        }
      };
      timeoutId = window.setTimeout(poll, 5);
    }

    const renderLoop = () => {
      if (isDisposed) return;
      if (!isTabVisible) {
        timeoutId = window.setTimeout(renderLoop, 200);
        return;
      }

      const elapsed = (performance.now() - startTime) * 0.001;
      uniforms.uTime.value = isReducedMotion ? 0.0 : elapsed;
      uniforms.uScroll.value = lastScrollY;
      uniforms.uCamOffset.value.copy(camera.position);

      const k = 0.12;
      currentMouse.x += (targetMouse.x - currentMouse.x) * k;
      currentMouse.y += (targetMouse.y - currentMouse.y) * k;
      currentStrength += (targetStrength - currentStrength) * 0.08;

      uniforms.uMouse.value.set(currentMouse.x, currentMouse.y);
      uniforms.uMouseStrength.value = isReducedMotion ? 0.0 : currentStrength;

      if (!isReducedMotion) {
        spatialGroup.rotation.z = elapsed * 0.04;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(renderLoop);
      } else {
        rafId = requestAnimationFrame(renderLoop);
      }
    };

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      cameraRef.current = null;
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);

      geometry.dispose();
      material.dispose();
      ringGeo.dispose();
      nodeGeo.dispose();
      wireMat.dispose();
      nodeMat.dispose();
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
      data-testid="global-three-scene"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden transition-colors duration-700 ${className ?? ""}`}
      style={{
        backgroundColor: "var(--section-ambient-tint, transparent)",
      }}
    />
  );
}
