import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BrowserManager } from '../src/browser-manager.js';
import { handleCommand } from '../src/commands.js';

describe('handleCommand（Playwright 使用）', () => {
  let manager;

  beforeAll(async () => {
    manager = new BrowserManager();
    await manager.launch();
  }, 30000);

  afterAll(async () => {
    await manager.close();
  });

  it('goto で外部 URL にナビゲートできる', async () => {
    const result = await handleCommand(manager, 'goto', ['https://example.com']);
    expect(result).toContain('Navigated to');
    expect(result).toContain('example.com');
  });

  it('goto で URL 未指定時にエラーを投げる', async () => {
    await expect(handleCommand(manager, 'goto', [])).rejects.toThrow('URL required');
  });

  it('goto で file:// を拒否する', async () => {
    await expect(handleCommand(manager, 'goto', ['file:///etc/passwd'])).rejects.toThrow('Protocol not allowed');
  });

  it('goto で内部 IP を拒否する', async () => {
    await expect(handleCommand(manager, 'goto', ['http://169.254.169.254/latest/'])).rejects.toThrow('Internal network access not allowed');
  });

  it('url で現在の URL を取得できる', async () => {
    await handleCommand(manager, 'goto', ['https://example.com']);
    const result = await handleCommand(manager, 'url', []);
    expect(result).toContain('example.com');
  });

  it('text でページテキストを取得できる', async () => {
    await handleCommand(manager, 'goto', ['https://example.com']);
    const result = await handleCommand(manager, 'text', []);
    expect(result).toContain('Example Domain');
  });

  it('status でサーバー状態を返す', async () => {
    const result = await handleCommand(manager, 'status', []);
    expect(result).toContain('Mode: headless');
    expect(result).toContain('Tabs:');
  });

  it('snapshot でアクセシビリティツリーを返す', async () => {
    await handleCommand(manager, 'goto', ['https://example.com']);
    const result = await handleCommand(manager, 'snapshot', []);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('snapshot -i でインタラクティブ要素に @ref を付与する', async () => {
    await handleCommand(manager, 'goto', ['https://example.com']);
    const result = await handleCommand(manager, 'snapshot', ['-i']);
    expect(result).toContain('@e');
  });

  it('unknown コマンドでエラーを投げる', async () => {
    await expect(handleCommand(manager, 'nonexistent', [])).rejects.toThrow('Unknown command');
  });

  it('viewport でサイズを取得できる', async () => {
    const result = await handleCommand(manager, 'viewport', []);
    expect(result).toMatch(/\d+x\d+/);
  });

  it('viewport でサイズを変更できる', async () => {
    await handleCommand(manager, 'viewport', ['800x600']);
    const result = await handleCommand(manager, 'viewport', []);
    expect(result).toBe('800x600');
    // 元に戻す
    await handleCommand(manager, 'viewport', ['1280x720']);
  });
});

describe('タブ管理', () => {
  let manager;

  beforeAll(async () => {
    manager = new BrowserManager();
    await manager.launch();
  }, 30000);

  afterAll(async () => {
    await manager.close();
  });

  it('newtab で新しいタブを開ける', async () => {
    const result = await handleCommand(manager, 'newtab', []);
    expect(result).toContain('New tab');
  });

  it('tabs でタブ一覧を取得できる', async () => {
    const result = await handleCommand(manager, 'tabs', []);
    expect(result).toContain('Tab');
    expect(result).toContain('→'); // アクティブタブのマーカー
  });

  it('tab でタブを切り替えられる', async () => {
    const result = await handleCommand(manager, 'tab', ['1']);
    expect(result).toContain('Switched to tab 1');
  });

  it('closetab でタブを閉じられる', async () => {
    // 新タブを開いて閉じる
    const newTabResult = await handleCommand(manager, 'newtab', []);
    const tabId = newTabResult.match(/New tab (\d+)/)[1];
    const result = await handleCommand(manager, 'closetab', [tabId]);
    expect(result).toContain('Closed tab');
  });

  it('newtab で内部 IP を拒否する', async () => {
    await expect(
      handleCommand(manager, 'newtab', ['http://169.254.169.254'])
    ).rejects.toThrow('Internal network access not allowed');
  });
});

describe('diff コマンドの URL バリデーション', () => {
  let manager;

  beforeAll(async () => {
    manager = new BrowserManager();
    await manager.launch();
  }, 30000);

  afterAll(async () => {
    await manager.close();
  });

  it('diff で内部 IP の url1 を拒否する', async () => {
    await expect(
      handleCommand(manager, 'diff', ['http://10.0.0.1', 'https://example.com'])
    ).rejects.toThrow('Internal network access not allowed');
  });

  it('diff で内部 IP の url2 を拒否する', async () => {
    await expect(
      handleCommand(manager, 'diff', ['https://example.com', 'http://192.168.1.1'])
    ).rejects.toThrow('Internal network access not allowed');
  });
});
