// browse/src/browser-manager.js
// Chromium ライフサイクル管理 + スナップショット @ref マッピング
import { chromium } from 'playwright';

export class BrowserManager {
  constructor() {
    this.browser = null;
    this.context = null;
    this.pages = new Map(); // tabId -> page
    this.activeTabId = 1;
    this.nextTabId = 1;
    this.refMap = new Map();     // @eN -> { locator, role, name }
    this.cursorRefMap = new Map(); // @cN -> { selector, description }
    this.lastSnapshot = null;
    this.headless = true;
  }

  async launch(options = {}) {
    const headless = options.headless !== false;
    this.headless = headless;

    const launchOptions = {
      headless,
      args: [
        '--no-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
      ],
    };

    if (!headless) {
      launchOptions.channel = 'chrome';
    }

    this.browser = await chromium.launch(launchOptions);
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    });

    // コンソール・ネットワークキャプチャ
    this.consoleLogs = [];
    this.networkLogs = [];

    const page = await this.context.newPage();
    this._attachPageListeners(page);
    this.pages.set(this.nextTabId, page);
    this.activeTabId = this.nextTabId;
    this.nextTabId++;

    return this;
  }

  _attachPageListeners(page) {
    page.on('console', msg => {
      this.consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        time: new Date().toISOString(),
      });
      // 循環バッファ 5000 件
      if (this.consoleLogs.length > 5000) this.consoleLogs.shift();
    });

    page.on('response', response => {
      this.networkLogs.push({
        url: response.url(),
        status: response.status(),
        method: response.request().method(),
        time: new Date().toISOString(),
      });
      if (this.networkLogs.length > 5000) this.networkLogs.shift();
    });
  }

  getActivePage() {
    return this.pages.get(this.activeTabId);
  }

  async newTab(url) {
    const page = await this.context.newPage();
    this._attachPageListeners(page);
    const tabId = this.nextTabId++;
    this.pages.set(tabId, page);
    this.activeTabId = tabId;
    if (url) await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    return tabId;
  }

  async switchTab(tabId) {
    if (!this.pages.has(tabId)) throw new Error(`Tab ${tabId} not found`);
    this.activeTabId = tabId;
    return tabId;
  }

  async closeTab(tabId) {
    const id = tabId || this.activeTabId;
    const page = this.pages.get(id);
    if (!page) throw new Error(`Tab ${id} not found`);
    await page.close();
    this.pages.delete(id);
    if (this.activeTabId === id) {
      const remaining = [...this.pages.keys()];
      this.activeTabId = remaining.length > 0 ? remaining[remaining.length - 1] : 0;
    }
    return id;
  }

  listTabs() {
    const tabs = [];
    for (const [id, page] of this.pages) {
      tabs.push({
        id,
        url: page.url(),
        active: id === this.activeTabId,
      });
    }
    return tabs;
  }

  // --- スナップショットシステム ---

  async snapshot(page, options = {}) {
    const { interactive, compact, depth, selector, diff, cursorInteractive } = options;

    let scope = page;
    if (selector) {
      scope = page.locator(selector);
    }

    // アクセシビリティスナップショット取得
    let tree;
    try {
      tree = await scope.ariaSnapshot({ timeout: 10000 });
    } catch {
      tree = await page.locator('body').ariaSnapshot({ timeout: 10000 });
    }

    // @ref 割り当て
    this.refMap.clear();
    let refIndex = 1;
    const lines = tree.split('\n');
    const output = [];

    for (const line of lines) {
      // 深さ制限
      if (depth) {
        const indent = line.match(/^(\s*)/)[1].length;
        if (indent / 2 > depth) continue;
      }

      const roleMatch = line.match(/- (\w+)(?:\s+"([^"]*)")?/);
      if (roleMatch) {
        const role = roleMatch[1];
        const name = roleMatch[2] || '';

        // interactive 以外はスキップ
        const interactiveRoles = ['link', 'button', 'textbox', 'checkbox', 'radio',
          'combobox', 'listbox', 'option', 'menuitem', 'tab', 'switch', 'slider',
          'spinbutton', 'searchbox'];

        if (interactive && !interactiveRoles.includes(role)) {
          if (!compact) output.push(line);
          continue;
        }

        const ref = `@e${refIndex++}`;
        this.refMap.set(ref, {
          role,
          name,
          locator: page.getByRole(role, name ? { name, exact: false } : {}),
        });

        const refLine = line.replace(/^(\s*- \w+)/, `$1 [${ref}]`);
        output.push(refLine);
      } else {
        if (!compact || !interactive) output.push(line);
      }
    }

    // -C: cursor-interactive (非ARIA要素)
    if (cursorInteractive) {
      this.cursorRefMap.clear();
      try {
        const clickableElements = await page.evaluate(() => {
          const elements = [];
          const all = document.querySelectorAll('*');
          for (const el of all) {
            const style = getComputedStyle(el);
            const hasClick = el.onclick || el.getAttribute('tabindex') >= '0';
            const hasCursor = style.cursor === 'pointer';
            const isStandard = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);
            if ((hasClick || hasCursor) && !isStandard && el.offsetParent !== null) {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                // nth-child セレクタ生成
                const parent = el.parentElement;
                const siblings = parent ? [...parent.children] : [];
                const index = siblings.indexOf(el) + 1;
                const tag = el.tagName.toLowerCase();
                const selector = parent
                  ? `${parent.tagName.toLowerCase()} > ${tag}:nth-child(${index})`
                  : tag;
                elements.push({
                  selector,
                  tag,
                  text: (el.textContent || '').trim().slice(0, 80),
                  className: el.className?.toString().slice(0, 60) || '',
                });
              }
            }
          }
          return elements.slice(0, 50);
        });

        let cIndex = 1;
        for (const el of clickableElements) {
          const ref = `@c${cIndex++}`;
          this.cursorRefMap.set(ref, {
            selector: el.selector,
            description: `${el.tag}${el.className ? '.' + el.className.split(' ')[0] : ''} "${el.text}"`,
          });
          output.push(`  - cursor-interactive [${ref}] ${el.tag} "${el.text}"`);
        }
      } catch { /* ページによってはevaluateが失敗 */ }
    }

    const result = output.join('\n');

    // --diff モード
    if (diff && this.lastSnapshot) {
      const oldLines = this.lastSnapshot.split('\n');
      const newLines = result.split('\n');
      const diffOutput = this._unifiedDiff(oldLines, newLines);
      this.lastSnapshot = result;
      return diffOutput;
    }

    this.lastSnapshot = result;
    return result;
  }

  _unifiedDiff(oldLines, newLines) {
    const output = ['--- previous', '+++ current'];
    const maxLen = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
      const old = oldLines[i];
      const cur = newLines[i];
      if (old === cur) {
        output.push(` ${old || ''}`);
      } else {
        if (old !== undefined) output.push(`-${old}`);
        if (cur !== undefined) output.push(`+${cur}`);
      }
    }
    return output.join('\n');
  }

  resolveRef(ref) {
    if (ref.startsWith('@e')) {
      const entry = this.refMap.get(ref);
      if (!entry) throw new Error(`Ref ${ref} not found. Run snapshot first.`);
      return entry.locator;
    }
    if (ref.startsWith('@c')) {
      const entry = this.cursorRefMap.get(ref);
      if (!entry) throw new Error(`Cursor ref ${ref} not found. Run snapshot -C first.`);
      return this.getActivePage().locator(entry.selector).first();
    }
    throw new Error(`Invalid ref format: ${ref}. Use @eN or @cN.`);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
