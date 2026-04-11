#!/usr/bin/env node
// browse/src/cli.js
// ブラウザサーバーへのシンCLIクライアント
// 使い方: node browse/src/cli.js <command> [args...]

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STATE_DIR = process.env.BROWSE_STATE_DIR || '.gstack';
const STATE_FILE = join(STATE_DIR, 'browse.json');
const SERVER_SCRIPT = join(__dirname, 'server.js');

function readState() {
  if (!existsSync(STATE_FILE)) return null;
  try {
    const raw = readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isServerAlive(state) {
  if (!state) return false;
  try {
    process.kill(state.pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [SERVER_SCRIPT], {
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

    child.stdout.on('data', chunk => {
      output += chunk.toString();
      if (output.includes('Server running on')) {
        clearTimeout(timeout);
        // サーバー起動完了 — state file を読む
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

    child.stderr.on('data', chunk => {
      const msg = chunk.toString();
      if (msg.includes('Failed to start')) {
        clearTimeout(timeout);
        reject(new Error(msg.trim()));
      }
    });

    child.on('error', err => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function sendCommand(state, command, args) {
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

使い方: node browse/src/cli.js <command> [args...]

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

  // stop コマンド
  if (args[0] === 'stop') {
    const state = readState();
    if (state && isServerAlive(state)) {
      process.kill(state.pid, 'SIGTERM');
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
