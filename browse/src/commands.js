// browse/src/commands.js
// ブラウザコマンドハンドラ

export async function handleCommand(manager, command, args) {
  const page = manager.getActivePage();
  if (!page && command !== 'status' && command !== 'tabs') {
    throw new Error('No active page. Server may not be initialized.');
  }

  switch (command) {
    // === ナビゲーション ===
    case 'goto': {
      const url = args[0];
      if (!url) throw new Error('URL required: goto <url>');
      // URL バリデーション（SSRF 防止）
      const parsed = new URL(url);
      if (['file:', 'javascript:', 'data:'].includes(parsed.protocol)) {
        throw new Error(`Protocol not allowed: ${parsed.protocol}`);
      }
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      return `Navigated to ${page.url()}`;
    }

    case 'back':
      await page.goBack({ timeout: 10000 });
      return `Back to ${page.url()}`;

    case 'forward':
      await page.goForward({ timeout: 10000 });
      return `Forward to ${page.url()}`;

    case 'reload':
      await page.reload({ timeout: 30000 });
      return `Reloaded ${page.url()}`;

    case 'url':
      return page.url();

    // === 読み取り ===
    case 'text': {
      const selector = args[0];
      if (selector) {
        return await page.locator(selector).innerText({ timeout: 5000 });
      }
      return await page.innerText('body', { timeout: 10000 });
    }

    case 'html': {
      const selector = args[0];
      if (selector) {
        return await page.locator(selector).innerHTML({ timeout: 5000 });
      }
      return await page.content();
    }

    case 'links': {
      const links = await page.evaluate(() => {
        return [...document.querySelectorAll('a[href]')].map(a => ({
          text: a.textContent.trim().slice(0, 100),
          href: a.href,
        })).filter(l => l.href && !l.href.startsWith('javascript:'));
      });
      return links.map(l => `${l.text} → ${l.href}`).join('\n') || 'No links found';
    }

    case 'forms': {
      const forms = await page.evaluate(() => {
        return [...document.querySelectorAll('form')].map((form, i) => {
          const fields = [...form.querySelectorAll('input, select, textarea')].map(f => ({
            tag: f.tagName.toLowerCase(),
            type: f.type || '',
            name: f.name || f.id || '',
            value: f.value || '',
            placeholder: f.placeholder || '',
          }));
          return { index: i, action: form.action, method: form.method, fields };
        });
      });
      return JSON.stringify(forms, null, 2);
    }

    case 'accessibility': {
      const tree = await page.locator('body').ariaSnapshot({ timeout: 10000 });
      return tree;
    }

    // === スナップショット ===
    case 'snapshot': {
      const options = {
        interactive: args.includes('-i'),
        compact: args.includes('-c'),
        diff: args.includes('-D'),
        cursorInteractive: args.includes('-C'),
      };
      const depthIdx = args.indexOf('-d');
      if (depthIdx !== -1 && args[depthIdx + 1]) {
        options.depth = parseInt(args[depthIdx + 1]);
      }
      const selIdx = args.indexOf('-s');
      if (selIdx !== -1 && args[selIdx + 1]) {
        options.selector = args[selIdx + 1];
      }
      return await manager.snapshot(page, options);
    }

    // === インタラクション ===
    case 'click': {
      const target = args[0];
      if (!target) throw new Error('Target required: click <@ref|selector>');
      if (target.startsWith('@')) {
        const locator = manager.resolveRef(target);
        await locator.click({ timeout: 5000 });
      } else {
        await page.click(target, { timeout: 5000 });
      }
      return `Clicked ${target}`;
    }

    case 'fill': {
      const target = args[0];
      const value = args.slice(1).join(' ');
      if (!target || value === undefined) throw new Error('Usage: fill <@ref|selector> <value>');
      if (target.startsWith('@')) {
        const locator = manager.resolveRef(target);
        await locator.fill(value, { timeout: 5000 });
      } else {
        await page.fill(target, value, { timeout: 5000 });
      }
      return `Filled ${target} with "${value}"`;
    }

    case 'select': {
      const target = args[0];
      const value = args.slice(1).join(' ');
      if (!target) throw new Error('Usage: select <@ref|selector> <value>');
      if (target.startsWith('@')) {
        const locator = manager.resolveRef(target);
        await locator.selectOption(value, { timeout: 5000 });
      } else {
        await page.selectOption(target, value, { timeout: 5000 });
      }
      return `Selected "${value}" in ${target}`;
    }

    case 'hover': {
      const target = args[0];
      if (!target) throw new Error('Target required: hover <@ref|selector>');
      if (target.startsWith('@')) {
        const locator = manager.resolveRef(target);
        await locator.hover({ timeout: 5000 });
      } else {
        await page.hover(target, { timeout: 5000 });
      }
      return `Hovered ${target}`;
    }

    case 'type': {
      const text = args.join(' ');
      if (!text) throw new Error('Text required: type <text>');
      await page.keyboard.type(text);
      return `Typed "${text}"`;
    }

    case 'press': {
      const key = args[0];
      if (!key) throw new Error('Key required: press <key>');
      await page.keyboard.press(key);
      return `Pressed ${key}`;
    }

    case 'scroll': {
      const direction = args[0] || 'down';
      const amount = parseInt(args[1]) || 500;
      if (direction === 'down') {
        await page.evaluate(a => window.scrollBy(0, a), amount);
      } else if (direction === 'up') {
        await page.evaluate(a => window.scrollBy(0, -a), amount);
      } else if (direction === 'top') {
        await page.evaluate(() => window.scrollTo(0, 0));
      } else if (direction === 'bottom') {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      }
      return `Scrolled ${direction} ${amount}px`;
    }

    case 'wait': {
      const target = args[0];
      if (!target) throw new Error('Usage: wait <selector|milliseconds>');
      if (/^\d+$/.test(target)) {
        const ms = Math.min(parseInt(target), 10000); // 最大10秒
        await page.waitForTimeout(ms);
        return `Waited ${ms}ms`;
      }
      await page.waitForSelector(target, { timeout: 10000 });
      return `Element ${target} appeared`;
    }

    case 'viewport': {
      const size = args[0];
      if (!size) {
        const vp = page.viewportSize();
        return `${vp.width}x${vp.height}`;
      }
      const [w, h] = size.split('x').map(Number);
      if (!w || !h) throw new Error('Usage: viewport <width>x<height>');
      await page.setViewportSize({ width: w, height: h });
      return `Viewport set to ${w}x${h}`;
    }

    case 'upload': {
      const selector = args[0];
      const filePath = args[1];
      if (!selector || !filePath) throw new Error('Usage: upload <selector> <filepath>');
      const input = target.startsWith('@') ? manager.resolveRef(selector) : page.locator(selector);
      await input.setInputFiles(filePath);
      return `Uploaded ${filePath} to ${selector}`;
    }

    // === 検査 ===
    case 'js': {
      const expr = args.join(' ');
      if (!expr) throw new Error('Expression required: js <expression>');
      // セキュリティ: eval されるが、ブラウザコンテキスト内なのでサーバー側は安全
      const result = await page.evaluate(expr);
      return typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
    }

    case 'console': {
      const count = parseInt(args[0]) || 20;
      const logs = manager.consoleLogs.slice(-count);
      return logs.map(l => `[${l.type}] ${l.time} ${l.text}`).join('\n') || 'No console output';
    }

    case 'network': {
      const count = parseInt(args[0]) || 20;
      const filter = args[1]; // オプション: status code filter
      let logs = manager.networkLogs.slice(-count * 2);
      if (filter === 'errors') {
        logs = logs.filter(l => l.status >= 400);
      }
      return logs.slice(-count).map(l => `${l.status} ${l.method} ${l.url}`).join('\n') || 'No network activity';
    }

    case 'cookies': {
      const cookies = await manager.context.cookies();
      const domain = args[0];
      const filtered = domain ? cookies.filter(c => c.domain.includes(domain)) : cookies;
      return filtered.map(c => `${c.domain} ${c.name}=${c.value.slice(0, 30)}${c.value.length > 30 ? '...' : ''}`).join('\n') || 'No cookies';
    }

    case 'storage': {
      const type = args[0] || 'local';
      const data = await page.evaluate(t => {
        const storage = t === 'session' ? sessionStorage : localStorage;
        const items = {};
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          items[key] = storage.getItem(key)?.slice(0, 100);
        }
        return items;
      }, type);
      return JSON.stringify(data, null, 2);
    }

    case 'is': {
      const state = args[0];
      const target = args[1];
      if (!state || !target) throw new Error('Usage: is <visible|enabled|disabled|checked|editable|focused> <selector|@ref>');
      const locator = target.startsWith('@') ? manager.resolveRef(target) : page.locator(target);
      let result;
      switch (state) {
        case 'visible': result = await locator.isVisible(); break;
        case 'enabled': result = await locator.isEnabled(); break;
        case 'disabled': result = await locator.isDisabled(); break;
        case 'checked': result = await locator.isChecked(); break;
        case 'editable': result = await locator.isEditable(); break;
        case 'focused': result = await page.evaluate(
          s => document.activeElement === document.querySelector(s),
          target.startsWith('@') ? null : target
        ); break;
        default: throw new Error(`Unknown state: ${state}`);
      }
      return `${state} ${target}: ${result}`;
    }

    case 'attrs': {
      const target = args[0];
      if (!target) throw new Error('Usage: attrs <selector|@ref>');
      const locator = target.startsWith('@') ? manager.resolveRef(target) : page.locator(target);
      const attrs = await locator.evaluate(el => {
        const result = {};
        for (const attr of el.attributes) {
          result[attr.name] = attr.value;
        }
        return result;
      });
      return JSON.stringify(attrs, null, 2);
    }

    case 'css': {
      const target = args[0];
      const prop = args[1];
      if (!target) throw new Error('Usage: css <selector|@ref> [property]');
      const locator = target.startsWith('@') ? manager.resolveRef(target) : page.locator(target);
      if (prop) {
        const value = await locator.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
        return `${prop}: ${value}`;
      }
      const styles = await locator.evaluate(el => {
        const cs = getComputedStyle(el);
        const important = ['display', 'position', 'width', 'height', 'margin', 'padding',
          'color', 'background-color', 'font-size', 'font-weight', 'border', 'opacity',
          'visibility', 'overflow', 'z-index', 'flex', 'grid'];
        const result = {};
        for (const p of important) result[p] = cs.getPropertyValue(p);
        return result;
      });
      return Object.entries(styles).map(([k, v]) => `${k}: ${v}`).join('\n');
    }

    case 'perf': {
      const metrics = await page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        return {
          dns: Math.round(perf?.domainLookupEnd - perf?.domainLookupStart || 0),
          tcp: Math.round(perf?.connectEnd - perf?.connectStart || 0),
          ttfb: Math.round(perf?.responseStart - perf?.requestStart || 0),
          domLoad: Math.round(perf?.domContentLoadedEventEnd - perf?.startTime || 0),
          fullLoad: Math.round(perf?.loadEventEnd - perf?.startTime || 0),
          fcp: Math.round(paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0),
          fp: Math.round(paint.find(p => p.name === 'first-paint')?.startTime || 0),
        };
      });
      return [
        `DNS:        ${metrics.dns}ms`,
        `TCP:        ${metrics.tcp}ms`,
        `TTFB:       ${metrics.ttfb}ms`,
        `DOM Load:   ${metrics.domLoad}ms`,
        `Full Load:  ${metrics.fullLoad}ms`,
        `FP:         ${metrics.fp}ms`,
        `FCP:        ${metrics.fcp}ms`,
      ].join('\n');
    }

    case 'inspect': {
      const target = args[0];
      if (!target) throw new Error('Usage: inspect <selector|@ref>');
      const locator = target.startsWith('@') ? manager.resolveRef(target) : page.locator(target);
      const info = await locator.evaluate(el => {
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const result = {
          tag: el.tagName.toLowerCase(),
          id: el.id,
          classes: [...el.classList],
          rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
          styles: {},
        };
        const props = ['display', 'position', 'top', 'left', 'width', 'height',
          'margin', 'padding', 'border', 'background', 'color', 'font',
          'z-index', 'opacity', 'overflow', 'cursor'];
        for (const p of props) result.styles[p] = cs.getPropertyValue(p);
        return result;
      });
      return JSON.stringify(info, null, 2);
    }

    // === ビジュアル ===
    case 'screenshot': {
      let path = null;
      let fullPage = true;
      let clip = null;
      let selector = null;

      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--viewport') {
          fullPage = false;
        } else if (args[i] === '--clip' && args[i + 1]) {
          const [x, y, w, h] = args[++i].split(',').map(Number);
          clip = { x, y, width: w, height: h };
          fullPage = false;
        } else if (args[i].startsWith('@') || args[i].startsWith('.') || args[i].startsWith('#') || args[i].startsWith('[')) {
          selector = args[i];
        } else {
          path = args[i];
        }
      }

      const defaultPath = path || `screenshot-${Date.now()}.png`;
      if (selector) {
        const locator = selector.startsWith('@') ? manager.resolveRef(selector) : page.locator(selector);
        await locator.screenshot({ path: defaultPath, timeout: 10000 });
      } else {
        const opts = { path: defaultPath };
        if (clip) opts.clip = clip;
        else opts.fullPage = fullPage;
        await page.screenshot(opts);
      }
      return `Screenshot saved: ${defaultPath}`;
    }

    case 'pdf': {
      const path = args[0] || `page-${Date.now()}.pdf`;
      await page.pdf({ path, format: 'A4' });
      return `PDF saved: ${path}`;
    }

    case 'responsive': {
      const basePath = args[0] || 'responsive';
      const viewports = [
        { name: 'mobile', width: 375, height: 812 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1280, height: 720 },
      ];
      const results = [];
      const original = page.viewportSize();
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const file = `${basePath}-${vp.name}.png`;
        await page.screenshot({ path: file, fullPage: true });
        results.push(`${vp.name} (${vp.width}x${vp.height}): ${file}`);
      }
      await page.setViewportSize(original);
      return results.join('\n');
    }

    // === スタイル修正 ===
    case 'style': {
      if (args[0] === '--undo') {
        // TODO: スタイル履歴管理
        return 'Style undo not yet tracked.';
      }
      const [sel, prop, ...valParts] = args;
      const val = valParts.join(' ');
      if (!sel || !prop || !val) throw new Error('Usage: style <selector> <property> <value>');
      await page.evaluate(({ s, p, v }) => {
        const el = document.querySelector(s);
        if (!el) throw new Error(`Element not found: ${s}`);
        el.style.setProperty(p, v);
      }, { s: sel, p: prop, v: val });
      return `Style ${sel} { ${prop}: ${val} }`;
    }

    case 'cleanup': {
      const all = args.includes('--all');
      const ads = all || args.includes('--ads');
      const cookies = all || args.includes('--cookies');
      const sticky = all || args.includes('--sticky');

      await page.evaluate(({ ads, cookies, sticky }) => {
        const selectors = [];
        if (ads) selectors.push('[class*="ad-"]', '[class*="ads-"]', '[id*="ad-"]', 'iframe[src*="ads"]');
        if (cookies) selectors.push('[class*="cookie"]', '[class*="consent"]', '[id*="cookie"]');
        if (sticky) selectors.push('[style*="position: fixed"]', '[style*="position: sticky"]');
        for (const sel of selectors) {
          for (const el of document.querySelectorAll(sel)) {
            el.remove();
          }
        }
      }, { ads, cookies, sticky });
      return 'Cleanup done';
    }

    // === 環境比較 ===
    case 'diff': {
      const url1 = args[0];
      const url2 = args[1];
      if (!url1 || !url2) throw new Error('Usage: diff <url1> <url2>');

      await page.goto(url1, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const text1 = await page.innerText('body');

      await page.goto(url2, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const text2 = await page.innerText('body');

      const lines1 = text1.split('\n');
      const lines2 = text2.split('\n');
      return manager._unifiedDiff(lines1, lines2);
    }

    // === タブ管理 ===
    case 'newtab': {
      const url = args[0];
      const tabId = await manager.newTab(url);
      return `New tab ${tabId}${url ? ` at ${url}` : ''}`;
    }

    case 'tab': {
      const tabId = parseInt(args[0]);
      if (!tabId) throw new Error('Usage: tab <tabId>');
      await manager.switchTab(tabId);
      return `Switched to tab ${tabId}`;
    }

    case 'closetab': {
      const tabId = args[0] ? parseInt(args[0]) : undefined;
      const closed = await manager.closeTab(tabId);
      return `Closed tab ${closed}`;
    }

    case 'tabs': {
      const tabs = manager.listTabs();
      return tabs.map(t => `${t.active ? '→' : ' '} Tab ${t.id}: ${t.url}`).join('\n');
    }

    // === サーバー管理 ===
    case 'status': {
      return [
        `Mode: ${manager.headless ? 'headless' : 'headed'}`,
        `Tabs: ${manager.pages.size}`,
        `Active: ${manager.activeTabId}`,
        `Refs: ${manager.refMap.size} (@e) + ${manager.cursorRefMap.size} (@c)`,
        `Console logs: ${manager.consoleLogs.length}`,
        `Network logs: ${manager.networkLogs.length}`,
      ].join('\n');
    }

    // === Cookie インポート ===
    case 'cookie-import': {
      const filePath = args[0];
      if (!filePath) throw new Error('Usage: cookie-import <json-file>');
      const fs = await import('fs');
      const raw = fs.readFileSync(filePath, 'utf-8');
      const cookies = JSON.parse(raw);
      await manager.context.addCookies(cookies);
      return `Imported ${cookies.length} cookies from ${filePath}`;
    }

    // === headed モード切替 ===
    case 'connect': {
      if (!manager.headless) return 'Already in headed mode';
      // 現在の cookie を保存
      const cookies = await manager.context.cookies();
      const storage = {};
      for (const [id, p] of manager.pages) {
        try { storage[id] = await p.evaluate(() => JSON.stringify(localStorage)); } catch { /* ignore */ }
      }
      // 再起動
      await manager.close();
      await manager.launch({ headless: false });
      // Cookie 復元
      if (cookies.length > 0) await manager.context.addCookies(cookies);
      return 'Switched to headed mode (visible Chrome)';
    }

    case 'disconnect': {
      if (manager.headless) return 'Already in headless mode';
      const cookies = await manager.context.cookies();
      await manager.close();
      await manager.launch({ headless: true });
      if (cookies.length > 0) await manager.context.addCookies(cookies);
      return 'Switched to headless mode';
    }

    default:
      throw new Error(`Unknown command: ${command}. Use "status" to check server state.`);
  }
}
