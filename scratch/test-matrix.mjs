import { spawn, execSync } from "child_process";
import http from "http";

const AB_PATH = "C:\\Users\\Aryo\\AppData\\Local\\npm-cache\\_npx\\6de2aa2fded2970c\\node_modules\\agent-browser\\bin\\agent-browser-win32-x64.exe";
const PORT = 3009;
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;

function runAb(args, session = "test_motion") {
  const cmd = `"${AB_PATH}" --session ${session} ${args}`;
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"], timeout: 20000 }).trim();
  } catch (err) {
    return `ERR: ${err.message}`;
  }
}

function waitPort(port, timeoutMs = 25000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`http://${HOST}:${port}/`, (res) => {
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error("Timeout waiting for server to start"));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

async function main() {
  console.log("=== STARTING SERVER FOR MOTION & PERFORMANCE AUDIT ===");
  const server = spawn("node", ["./node_modules/next/dist/bin/next", "start", "-H", HOST, "-p", String(PORT)], {
    stdio: "inherit",
    env: { ...process.env, PORT: String(PORT) },
  });

  try {
    await waitPort(PORT);
    console.log(`✓ Server ready at ${BASE_URL}`);

    const results = {};

    // 1. Initial Load Test
    console.log("\n[TEST 1] Initial Load & HUD Orchestration...");
    runAb(`set viewport 1280 800`);
    runAb(`open ${BASE_URL}`);
    runAb(`wait 1200`);

    const initialMetrics = JSON.parse(runAb(`eval "JSON.stringify({ scrollY: window.scrollY, stCount: window.ScrollTrigger ? window.ScrollTrigger.getAll().length : 0, isLenis: !!window.lenis || !!window.Lenis || document.documentElement.classList.contains('lenis'), titleVisible: getComputedStyle(document.getElementById('hero-display-name')).visibility, projectsVal: document.querySelector('#hero .tabular-nums')?.textContent })"`));
    results.initialLoad = initialMetrics;
    console.log("Initial Metrics:", initialMetrics);

    // 2. Slow Scroll & Fast Scroll
    console.log("\n[TEST 2] Slow & Fast Scroll Test...");
    for (let i = 0; i < 5; i++) {
      runAb(`scroll down 350`);
      runAb(`wait 250`);
    }
    const slowScrollPos = JSON.parse(runAb(`eval "JSON.stringify({ scrollY: window.scrollY })"`));
    
    // Fast scroll down
    runAb(`scroll down 1800`);
    runAb(`wait 500`);
    const fastScrollPos = JSON.parse(runAb(`eval "JSON.stringify({ scrollY: window.scrollY, navHidden: document.querySelector('header')?.style.transform.includes('-100') })"`));
    
    // Fast scroll up
    runAb(`scroll up 1200`);
    runAb(`wait 400`);
    const scrollUpPos = JSON.parse(runAb(`eval "JSON.stringify({ scrollY: window.scrollY, navVisible: document.querySelector('header')?.style.transform.includes('0px') || !document.querySelector('header')?.style.transform.includes('-100') })"`));
    
    results.scrollTests = { slowScrollPos, fastScrollPos, scrollUpPos };
    console.log("Scroll Tests:", results.scrollTests);

    // 3. Anchor Clicks During Scroll
    console.log("\n[TEST 3] Anchor Clicks During Scroll...");
    runAb(`click "a[href='#skills']"`);
    runAb(`wait 1200`);
    const skillsAnchor = JSON.parse(runAb(`eval "JSON.stringify({ scrollY: window.scrollY, skillsTop: document.getElementById('skills')?.getBoundingClientRect().top })"`));
    
    runAb(`click "a[href='#projects']"`);
    runAb(`wait 1200`);
    const projectsAnchor = JSON.parse(runAb(`eval "JSON.stringify({ scrollY: window.scrollY, projectsTop: document.getElementById('projects')?.getBoundingClientRect().top })"`));
    
    results.anchorClicks = { skillsAnchor, projectsAnchor };
    console.log("Anchor Clicks:", results.anchorClicks);

    // 4. Mid-page Reload Test
    console.log("\n[TEST 4] Mid-Page Reload Test...");
    runAb(`reload`);
    runAb(`wait 1000`);
    const reloadMetrics = JSON.parse(runAb(`eval "JSON.stringify({ scrollY: window.scrollY, bodyVisible: getComputedStyle(document.body).visibility, shutterTrapped: !!document.querySelector('.is-navigating') })"`));
    results.midPageReload = reloadMetrics;
    console.log("Mid-page Reload:", reloadMetrics);

    // 5. Memory Leak & 10x Navigation Round-trip Test
    console.log("\n[TEST 5] 10x Route Navigation Round-Trip (Leak & ScrollTrigger audit)...");
    const stCountBefore = JSON.parse(runAb(`eval "window.ScrollTrigger ? window.ScrollTrigger.getAll().length : 0"`));
    
    for (let round = 1; round <= 10; round++) {
      runAb(`open ${BASE_URL}/projects/pos-livingroom`);
      runAb(`wait 500`);
      runAb(`open ${BASE_URL}`);
      runAb(`wait 500`);
    }

    const stCountAfter = JSON.parse(runAb(`eval "window.ScrollTrigger ? window.ScrollTrigger.getAll().length : 0"`));
    const memoryMetrics = JSON.parse(runAb(`eval "JSON.stringify({ stBefore: ${stCountBefore}, stAfter: ${stCountAfter}, jsHeapUsedMB: window.performance && window.performance.memory ? (window.performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2) : 'N/A' })"`));
    results.memoryLeak10x = memoryMetrics;
    console.log("10x Route Navigation Metrics:", memoryMetrics);

    // 6. Viewport 360px Mobile Test
    console.log("\n[TEST 6] Mobile 360px Viewport Test...");
    runAb(`set viewport 360 740`);
    runAb(`wait 400`);
    const mobileMetrics = JSON.parse(runAb(`eval "JSON.stringify({ innerWidth: window.innerWidth, horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth, heroTitleVisible: getComputedStyle(document.getElementById('hero-display-name')).visibility, menuButtonPresent: !!document.querySelector('button[aria-label*=\"menu\" i]') || !!document.querySelector('button:has(svg)') })"`));
    results.mobile360 = mobileMetrics;
    console.log("Mobile 360px Metrics:", mobileMetrics);

    // 7. Reduced-Motion Mode Test
    console.log("\n[TEST 7] Reduced-Motion Test...");
    runAb(`set media reduced-motion`);
    runAb(`open ${BASE_URL}`);
    runAb(`wait 500`);
    const reducedMotionMetrics = JSON.parse(runAb(`eval "JSON.stringify({ heroNameTransform: getComputedStyle(document.querySelector('.hero-name-line')).transform, lenisDestroyed: !document.documentElement.classList.contains('lenis-smooth') })"`));
    results.reducedMotion = reducedMotionMetrics;
    console.log("Reduced Motion Metrics:", reducedMotionMetrics);

    console.log("\n=== AUDIT SUMMARY ===");
    console.log(JSON.stringify(results, null, 2));

  } finally {
    console.log("\nShutting down server...");
    server.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
