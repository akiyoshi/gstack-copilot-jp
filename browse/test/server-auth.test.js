import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { randomUUID } from 'crypto';

// サーバーの認証ロジックを直接テストするため、簡易版サーバーを構築
// 実際の server.js と同じ認証パターンを再現

describe('server 認証', () => {
  let server;
  let port;
  const token = randomUUID();

  beforeAll(async () => {
    server = createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

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

      const auth = req.headers.authorization;
      if (!auth || auth !== `Bearer ${token}`) {
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        res.end('Unauthorized');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    });

    await new Promise(resolve => {
      server.listen(0, '127.0.0.1', resolve);
    });
    port = server.address().port;
  });

  afterAll(() => {
    server?.close();
  });

  it('正しいトークンで 200 を返す', async () => {
    const res = await fetch(`http://127.0.0.1:${port}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ command: 'status' }),
    });
    expect(res.status).toBe(200);
  });

  it('トークンなしで 401 を返す', async () => {
    const res = await fetch(`http://127.0.0.1:${port}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'status' }),
    });
    expect(res.status).toBe(401);
  });

  it('不正なトークンで 401 を返す', async () => {
    const res = await fetch(`http://127.0.0.1:${port}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer wrong-token',
      },
      body: JSON.stringify({ command: 'status' }),
    });
    expect(res.status).toBe(401);
  });

  it('GET リクエストで 405 を返す', async () => {
    const res = await fetch(`http://127.0.0.1:${port}`, {
      method: 'GET',
    });
    expect(res.status).toBe(405);
  });

  it('OPTIONS リクエストで 204 を返す（CORS preflight）', async () => {
    const res = await fetch(`http://127.0.0.1:${port}`, {
      method: 'OPTIONS',
    });
    expect(res.status).toBe(204);
  });
});
