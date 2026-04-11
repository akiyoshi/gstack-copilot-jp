#!/usr/bin/env node
// browse/src/server.js
// Playwright ベースのブラウザ自動化 HTTP サーバー
// 起動: node browse/src/server.js
// 停止: 30分アイドルで自動停止

import { createServer } from 'http';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { BrowserManager } from './browser-manager.js';
import { handleCommand } from './commands.js';

const PORT = parseInt(process.env.BROWSE_PORT) || 0; // 0 = ランダム
const IDLE_TIMEOUT = parseInt(process.env.BROWSE_IDLE_TIMEOUT) || 30 * 60 * 1000;
const STATE_DIR = process.env.BROWSE_STATE_DIR || '.gstack';
const STATE_FILE = join(STATE_DIR, 'browse.json');

const token = randomUUID();
const manager = new BrowserManager();
let lastActivity = Date.now();
let idleTimer = null;

function resetIdleTimer() {
  lastActivity = Date.now();
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    console.log('[browse] Idle timeout — shutting down');
    await shutdown();
  }, IDLE_TIMEOUT);
}

async function shutdown() {
  try {
    await manager.close();
  } catch { /* ignore */ }
  try {
    if (existsSync(STATE_FILE)) rmSync(STATE_FILE);
  } catch { /* ignore */ }
  process.exit(0);
}

// シグナルハンドリング
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const server = createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method not allowed');
    return;
  }

  // Bearer token 認証
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${token}`) {
    res.writeHead(401, { 'Content-Type': 'text/plain' });
    res.end('Unauthorized');
    return;
  }

  resetIdleTimer();

  // ボディ読み取り
  let body = '';
  for await (const chunk of req) body += chunk;

  try {
    const { command, args = [] } = JSON.parse(body);

    if (!command) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing "command" field');
      return;
    }

    const result = await handleCommand(manager, command, args);
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(result);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Error: ${err.message}`);
  }
});

async function start() {
  console.log('[browse] Launching Chromium...');
  await manager.launch();

  server.listen(PORT, '127.0.0.1', () => {
    const addr = server.address();
    const state = {
      port: addr.port,
      token,
      pid: process.pid,
      started: new Date().toISOString(),
    };

    // 状態ファイル書き込み
    if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), { mode: 0o600 });

    console.log(`[browse] Server running on http://127.0.0.1:${addr.port}`);
    console.log(`[browse] State file: ${STATE_FILE}`);
    console.log(`[browse] Idle timeout: ${IDLE_TIMEOUT / 1000}s`);

    resetIdleTimer();
  });
}

start().catch(err => {
  console.error('[browse] Failed to start:', err.message);
  process.exit(1);
});
