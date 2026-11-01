import { spawn } from 'node:child_process';
import http from 'node:http';

const PORT = 3003;
console.log(`[Test] Starting next dev on port ${PORT}...`);
const devProcess = spawn('npx.cmd', ['next', 'dev', '-p', String(PORT)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
  cwd: process.cwd(),
});

let logs = '';
devProcess.stdout.on('data', (d) => {
  logs += d.toString();
  process.stdout.write('[Next] ' + d);
});
devProcess.stderr.on('data', (d) => {
  logs += d.toString();
  process.stderr.write('[Next Err] ' + d);
});

function probe() {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${PORT}/`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, length: data.length }));
    });
    req.on('error', reject);
    req.setTimeout(25000, () => req.destroy(new Error('Timeout')));
  });
}

// Poll server
for (let i = 0; i < 25; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  try {
    const res = await probe();
    console.log(`\n[Result] Success! Status: ${res.status}, HTML bytes: ${res.length}`);
    break;
  } catch {
    process.stdout.write('.');
  }
}

devProcess.kill();
try { process.kill(devProcess.pid); } catch {}
