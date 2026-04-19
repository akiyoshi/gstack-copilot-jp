#!/usr/bin/env bun
// browse/src/cli.ts
// ブラウザサーバーへのシンCLIクライアント
// 使い方: bun browse/src/cli.ts <command> [args...]
//         または browse/dist/browse <command> [args...] (コンパイル済み)

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { spawn } from 'child_process';

interface BrowseState {
  port: number;
  token: string;
  pid: number;
  started: string;
  binaryVersion?: string;
}

// パス解決: コンパイル済みバイナリでもソース実行でも動くようにする
function resolveProjectRoot(): string {
  // git root があればそれを使う
  try {
    const result = Bun.spawnSync(['git', 'rev-parse', '--show-toplevel']);
    const root = result.stdout.toString().trim();
    if (root) return root;
  } catch { /* ignore */ }
  // フォールバック: カレントディレクトリ
  return process.cwd();
}

const PROJECT_ROOT = resolveProjectRoot();
const BROWSE_DIR = join(PROJECT_ROOT, 'browse');
const STATE_DIR = process.env.BROWSE_STATE_DIR || join(PROJECT_ROOT, '.gstack');
const STATE_FILE = join(STATE_DIR, 'browse.json');
const SERVER_SCRIPT = join(BROWSE_DIR, 'src', 'server.ts');

function readState(): BrowseState | null {
  if (!existsSync(STATE_FILE)) return null;
  try {
    const raw = readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(raw) as BrowseState;
  } catch {
    return null;
  }
}

function isServerAlive(state: BrowseState | null): boolean {
  if (!state) return false;
  try {
    process.kill(state.pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function stopServer(state: BrowseState): Promise<void> {
  // 安全なシャットダウン: まず HTTP リクエストで停止を試みる
  try {
    await fetch(`http://127.0.0.1:${state.port}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`,
      },
      body: JSON.stringify({ command: '__shutdown' }),
      signal: AbortSignal.timeout(3000),
    });
    // 少し待ってプロセス終了を確認
    await Bun.sleep(500);
    if (!isServerAlive(state)) return;
  } catch { /* HTTP shutdown failed, fall back to SIGTERM */ }

  // フォールバック: SIGTERM
  try {
    process.kill(state.pid, 'SIGTERM');
  } catch { /* already dead */ }
}

async function startServer(): Promise<BrowseState> {
  return new Promise((resolve, reject) => {
    const child = spawn('bun', ['run', SERVER_SCRIPT], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        BROWSE_STATE_DIR: STATE_DIR,
      },
    });

    child.unref();

    let output = '';
    const timeout = setTimeout(() => {
      reject(new Error('Server start timeout (15s)'));
    }, 15000);

    child.stdout?.on('data', (chunk: Buffer) => {
      output += chunk.toString();
      if (output.includes('Server running on')) {
        clearTimeout(timeout);
        setTimeout(() => {
          const state = readState();
          if (state) {
            resolve(state);
          } else {
            reject(new Error('Server started but state file not found'));
          }
        }, 200);
      }
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      const msg = chunk.toString();
      if (msg.includes('Failed to start')) {
        clearTimeout(timeout);
        reject(new Error(msg.trim()));
      }
    });

    child.on('error', (err: Error) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function sendCommand(state: BrowseState, command: string, args: string[]): Promise<string> {
  const url = `http://127.0.0.1:${state.port}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.token}`,
    },
    body: JSON.stringify({ command, args }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text);
  }
  return text;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    console.log(`gstack-copilot-jp browse CLI

使い方: $B <command> [args...]
        bun browse/src/cli.ts <command> [args...]

ナビゲーション:
  goto <url>          ページに移動
  back                戻る
  forward             進む
  reload              リロード
  url                 現在のURL

読み取り:
  text [selector]     テキスト取得
  html [selector]     HTML取得
  links               リンク一覧
  forms               フォーム一覧
  accessibility       アクセシビリティツリー

スナップショット:
  snapshot [-i] [-c] [-d N] [-s sel] [-D] [-C]
    -i  インタラクティブ要素のみ
    -c  コンパクト
    -d  深さ制限
    -s  スコープ（セレクタ）
    -D  前回との差分
    -C  非ARIA要素も含む

インタラクション:
  click <@ref|sel>    クリック
  fill <@ref|sel> <text> 入力
  select <@ref|sel> <value> 選択
  hover <@ref|sel>    ホバー
  type <text>         キーボード入力
  press <key>         キー押下
  scroll <dir> [px]   スクロール
  wait <sel|ms>       待機
  viewport [WxH]      ビューポート

検査:
  js <expr>           JavaScript実行
  console [N]         コンソールログ
  network [N]         ネットワークログ
  cookies [domain]    Cookie一覧
  storage [local|session] ストレージ
  is <state> <sel>    状態チェック
  attrs <sel>         属性取得
  css <sel> [prop]    CSS取得
  perf                パフォーマンス指標
  inspect <sel>       要素詳細

ビジュアル:
  screenshot [opts] [path]  スクリーンショット
  pdf [path]          PDF出力
  responsive [base]   レスポンシブ（3サイズ）
  diff <url1> <url2>  環境比較

スタイル:
  style <sel> <prop> <val>  CSS変更
  cleanup [--all|--ads|--cookies|--sticky]

タブ:
  newtab [url]        新規タブ
  tab <id>            タブ切替
  closetab [id]       タブ閉じる
  tabs                タブ一覧

モード切替:
  connect             headed モード（可視Chrome）
  disconnect          headless モードに戻す
  status              サーバー状態

その他:
  cookie-import <file> Cookie JSONインポート
  stop                サーバー停止`);
    process.exit(0);
  }

  // stop コマンド — 安全なシャットダウン
  if (args[0] === 'stop') {
    const state = readState();
    if (state && isServerAlive(state)) {
      await stopServer(state);
      console.log('Server stopped');
    } else {
      console.log('Server not running');
    }
    process.exit(0);
  }

  // サーバー起動確認
  let state = readState();
  if (!state || !isServerAlive(state)) {
    console.error('[browse] Starting server...');
    try {
      state = await startServer();
      console.error(`[browse] Server ready on port ${state.port}`);
    } catch (err) {
      console.error(`[browse] ${err.message}`);
      process.exit(1);
    }
  }

  // コマンド送信
  const command = args[0];
  const cmdArgs = args.slice(1);

  try {
    const result = await sendCommand(state, command, cmdArgs);
    console.log(result);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
