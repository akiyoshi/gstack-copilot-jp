#!/usr/bin/env bun
// browse/src/server.ts
// Playwright ベースのブラウザ自動化 HTTP サーバー（Bun.serve）
// 起動: bun browse/src/server.ts
// 停止: 30分アイドルで自動停止、または /shutdown エンドポイント

import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { BrowserManager } from './browser-manager.js';
import { handleCommand } from './commands.js';

const PORT = parseInt(process.env.BROWSE_PORT || '0') || 0;
const IDLE_TIMEOUT = parseInt(process.env.BROWSE_IDLE_TIMEOUT || '') || 30 * 60 * 1000;
const STATE_DIR = process.env.BROWSE_STATE_DIR || '.gstack';
const STATE_FILE = join(STATE_DIR, 'browse.json');

const token = randomUUID();
const manager = new BrowserManager();
let idleTimer: ReturnType<typeof setTimeout> | null = null;

function resetIdleTimer(): void {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    console.log('[browse] Idle timeout — shutting down');
    await shutdown();
  }, IDLE_TIMEOUT);
}

async function shutdown(): Promise<void> {
  try { await manager.close(); } catch { /* ignore */ }
  try { if (existsSync(STATE_FILE)) rmSync(STATE_FILE); } catch { /* ignore */ }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function start(): Promise<void> {
  console.log('[browse] Launching Chromium...');
  await manager.launch();

  const server = Bun.serve({
    port: PORT,
    hostname: '127.0.0.1',
    async fetch(req: Request): Promise<Response> {
      // CORS preflight
      if (req.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': 'http://localhost',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }

      if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
      }

      // Bearer token 認証
      const auth = req.headers.get('authorization');
      if (!auth || auth !== `Bearer ${token}`) {
        return new Response('Unauthorized', { status: 401 });
      }

      resetIdleTimer();

      try {
        const body = await req.json() as { command?: string; args?: string[] };
        const { command, args = [] } = body;

        if (!command) {
          return new Response('Missing "command" field', { status: 400 });
        }

        // 安全なシャットダウンエンドポイント
        if (command === '__shutdown') {
          setTimeout(() => shutdown(), 100);
          return new Response('Shutting down');
        }

        const result = await handleCommand(manager, command, args);
        return new Response(result, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(`Error: ${message}`, { status: 500 });
      }
    },
  });

  const state = {
    port: server.port,
    token,
    pid: process.pid,
    started: new Date().toISOString(),
  };

  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), { mode: 0o600 });

  console.log(`[browse] Server running on http://127.0.0.1:${server.port}`);
  console.log(`[browse] State file: ${STATE_FILE}`);
  console.log(`[browse] Idle timeout: ${IDLE_TIMEOUT / 1000}s`);

  resetIdleTimer();
}

start().catch(err => {
  console.error('[browse] Failed to start:', err instanceof Error ? err.message : err);
  process.exit(1);
});
