#!/usr/bin/env node
/** Rough startup timing (main process ready → first window show). Not a benchmark claim. */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const started = Date.now();

const env = { ...process.env, NEXUS_MEASURE_STARTUP: '1' };
delete env.ELECTRON_RUN_AS_NODE;

const electron = path.join(root, 'node_modules', '.bin', 'electron');
const args =
  process.platform === 'linux'
    ? ['--no-sandbox', '--disable-gpu', '.']
    : ['.'];

const child = spawn(electron, args, { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });

let closed = false;
const finish = (label) => {
  if (closed) return;
  closed = true;
  const ms = Date.now() - started;
  console.log(`[NEXUS startup measure] ${label}: ${ms} ms (environment-dependent)`);
  try {
    child.kill();
  } catch {
    /* ignore */
  }
  process.exit(0);
};

child.stdout?.on('data', (buf) => {
  const text = buf.toString();
  if (text.includes('NEXUS_STARTUP_READY')) {
    finish('ready-to-show');
  }
});

child.stderr?.on('data', (buf) => {
  const text = buf.toString();
  if (text.includes('NEXUS_STARTUP_READY')) {
    finish('ready-to-show');
  }
});

setTimeout(() => finish('timeout-15s'), 15000);
child.on('exit', () => finish('process-exit'));
