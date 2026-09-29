#!/usr/bin/env node
/**
 * Spawn Electron with a real browser main process.
 * Cursor/sandbox environments often set ELECTRON_RUN_AS_NODE=1, which breaks require('electron').app.
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const electronBin =
  process.platform === 'win32'
    ? path.join(root, 'node_modules', '.bin', 'electron.cmd')
    : path.join(root, 'node_modules', '.bin', 'electron');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const userArgs = process.argv.slice(2);
const args = [...userArgs];

if (process.platform === 'linux') {
  if (!args.some((a) => a === '--no-sandbox')) {
    args.unshift('--no-sandbox');
  }
  if (!args.some((a) => a === '--disable-gpu')) {
    args.unshift('--disable-gpu');
  }
}

const child = spawn(electronBin, args, {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 0);
});
