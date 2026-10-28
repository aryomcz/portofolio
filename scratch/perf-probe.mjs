import { spawn, execSync } from "child_process";
import http from "http";

const AB_PATH = "C:\\Users\\Aryo\\AppData\\Local\\npm-cache\\_npx\\6de2aa2fded2970c\\node_modules\\agent-browser\\bin\\agent-browser-win32-x64.exe";
const PORT = 3010;
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;

function runAb(args, session = "perf_session") {
  const cmd = `"${AB_PATH}" --session ${session} ${args}`;
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"], timeout: 15000 }).trim();
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
          setTimeout(check, 400);
        }
      });
    };
    check();
  });
}

const METRICS_SCRIPT = `
(() => {
  const nav = performance.getEntriesByType('navigation')[0] || {};
  const paints = performance.getEntriesByType('paint');
  const fcp = paints.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
  
  let cls = 0;
  try {
    const entries = performance.getEntriesByType('layout-shift');
    for (const e of entries) {
      if (!e.hadRecentInput) cls += e.value;
    }
  } catch(e) {}

  return JSON.stringify({
    ttfb: Math.round(nav.responseStart - nav.requestStart) || 0,
    domInteractive: Math.round(nav.domInteractive) || 0,
    domComplete: Math.round(nav.domComplete) || 0,
    fcp: Math.round(fcp),
    cls: Number(cls.toFixed(4)),
    jsHeapMB: window.performance && window.performance.memory ? Number((window.performance.memory.usedJSHeapSize / (1024*1024)).toFixed(2)) : 0
  });
})()
`;

async function main() {
  const server = spawn("node", ["./node_modules/next/dist/bin/next", "start", "-H", HOST, "-p", String(PORT)], {
    stdio: "inherit",
    env: { ...process.env, PORT: String(PORT) },
  });

  try {
    await waitPort(PORT);

    // Test Mobile (360x740)
    runAb(`set viewport 360 740`);
    runAb(`open ${BASE_URL}`);
    runAb(`wait 2000`);
    const mobileMetrics = JSON.parse(runAb(`eval "${METRICS_SCRIPT.replace(/\n/g, ' ')}"`));

    // Test Desktop (1280x800)
    runAb(`set viewport 1280 800`);
    runAb(`open ${BASE_URL}`);
    runAb(`wait 2000`);
    const desktopMetrics = JSON.parse(runAb(`eval "${METRICS_SCRIPT.replace(/\n/g, ' ')}"`));

    console.log("MOBILE_METRICS:" + JSON.stringify(mobileMetrics));
    console.log("DESKTOP_METRICS:" + JSON.stringify(desktopMetrics));
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch(console.error);
