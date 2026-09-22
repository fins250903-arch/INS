#!/usr/bin/env node
/**
 * Renders pages in headless Chrome and reports the layout problems a structural HTTP check cannot
 * see: horizontal overflow, images that never loaded, images drawn at the wrong aspect ratio, and
 * uncaught page errors.
 *
 * Chrome is driven straight over the DevTools protocol so the check needs no extra dependency —
 * Node's built-in WebSocket is enough.
 *
 * Usage:
 *   node scripts/visual-audit.mjs http://localhost:8787
 *   node scripts/visual-audit.mjs https://insbs.net --pages lp --viewport mobile
 *   node scripts/visual-audit.mjs http://localhost:8787 --shard 7/100 --out /tmp/shard-7.json
 *   node scripts/visual-audit.mjs http://localhost:8787 --only /osaka/ --screenshots /tmp/shots
 */
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const CLIENT_DIR = join(ROOT, 'dist', 'client');

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, mobile: false },
  mobile: { width: 390, height: 844, mobile: true }
};

const MAX_SCREENSHOT_HEIGHT = 8000;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'google-chrome',
  'chromium',
  'chromium-browser'
].filter(Boolean);

function parseArgs(argv) {
  const positional = [];
  const options = {
    pages: 'all',
    viewports: ['desktop', 'mobile'],
    shard: null,
    out: null,
    screenshots: null,
    concurrency: 8,
    only: []
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--pages') options.pages = argv[++i];
    else if (arg === '--viewport') options.viewports = [argv[++i]];
    else if (arg === '--shard') options.shard = argv[++i];
    else if (arg === '--out') options.out = argv[++i];
    else if (arg === '--screenshots') options.screenshots = argv[++i];
    else if (arg === '--concurrency') options.concurrency = Number(argv[++i]);
    else if (arg === '--only') options.only.push(argv[++i]);
    else positional.push(arg);
  }
  return { baseUrl: positional[0], options };
}

/** Minimal DevTools protocol client: one WebSocket, one promise per command. */
class Cdp {
  #socket;
  #nextId = 1;
  #pending = new Map();
  #listeners = new Set();

  constructor(socket) {
    this.#socket = socket;
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== undefined) {
        const entry = this.#pending.get(message.id);
        if (!entry) return;
        this.#pending.delete(message.id);
        if (message.error) entry.reject(new Error(message.error.message));
        else entry.resolve(message.result);
        return;
      }
      for (const listener of this.#listeners) listener(message);
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolvePromise, reject) => {
      socket.addEventListener('open', resolvePromise, { once: true });
      socket.addEventListener('error', () => reject(new Error(`cannot connect to ${url}`)), {
        once: true
      });
    });
    return new Cdp(socket);
  }

  send(method, params = {}, sessionId) {
    const id = this.#nextId++;
    this.#socket.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((resolvePromise, reject) => {
      this.#pending.set(id, { resolve: resolvePromise, reject });
    });
  }

  on(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /** Resolves on the first matching event, or rejects once `timeout` elapses. */
  once(method, sessionId, timeout) {
    return new Promise((resolvePromise, reject) => {
      const timer = setTimeout(() => {
        off();
        reject(new Error(`timed out waiting for ${method}`));
      }, timeout);
      const off = this.on((message) => {
        if (message.method !== method || (sessionId && message.sessionId !== sessionId)) return;
        clearTimeout(timer);
        off();
        resolvePromise(message.params);
      });
    });
  }

  close() {
    this.#socket.close();
  }
}

async function launchChrome() {
  const userDataDir = await mkdtemp(join(tmpdir(), 'visual-audit-'));
  const args = [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${userDataDir}`,
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--font-render-hinting=none',
    'about:blank'
  ];

  let child;
  let lastError;
  for (const binary of CHROME_CANDIDATES) {
    try {
      child = spawn(binary, args, { stdio: ['ignore', 'ignore', 'pipe'] });
      await new Promise((resolvePromise, reject) => {
        child.once('error', reject);
        setTimeout(resolvePromise, 150);
      });
      break;
    } catch (error) {
      lastError = error;
      child = undefined;
    }
  }
  if (!child) throw new Error(`no usable Chrome binary (${lastError?.message ?? 'not found'})`);

  const endpoint = await new Promise((resolvePromise, reject) => {
    let buffer = '';
    const timer = setTimeout(() => reject(new Error('Chrome never printed a DevTools endpoint')), 30000);
    child.stderr.setEncoding('utf-8');
    child.stderr.on('data', (chunk) => {
      buffer += chunk;
      const found = buffer.match(/ws:\/\/\S+/);
      if (found) {
        clearTimeout(timer);
        resolvePromise(found[0]);
      }
    });
  });

  const cdp = await Cdp.connect(endpoint);
  return {
    cdp,
    async close() {
      cdp.close();
      const exited = new Promise((resolvePromise) => child.once('exit', resolvePromise));
      child.kill('SIGTERM');
      await exited;
      // Chrome's helper processes keep flushing the profile for a moment after the parent exits, so
      // removing the directory is best effort — a leftover temp dir must not fail the audit.
      await rm(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(
        () => {}
      );
    }
  };
}

/**
 * Runs inside the page. Waits for fonts and images to settle, then measures the things that show up
 * as a broken layout: a document wider than the viewport, images with no intrinsic size, and images
 * whose box does not match their natural aspect ratio.
 */
const AUDIT_EXPRESSION = `(async () => {
  const settle = (img) =>
    img.complete
      ? null
      : new Promise((done) => {
          const finish = () => done();
          img.addEventListener('load', finish, { once: true });
          img.addEventListener('error', finish, { once: true });
          setTimeout(finish, 8000);
        });

  document.querySelectorAll('img[loading="lazy"]').forEach((img) => img.removeAttribute('loading'));
  window.scrollTo(0, document.body.scrollHeight);
  window.scrollTo(0, 0);
  await Promise.all([...document.images].map(settle));
  await document.fonts.ready;
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));

  const viewportWidth = window.innerWidth;
  const scrollWidth = Math.max(
    document.documentElement.scrollWidth,
    document.body ? document.body.scrollWidth : 0
  );

  const describe = (el) => {
    const id = el.id ? '#' + el.id : '';
    const cls = typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/).join('.') : '';
    return (el.tagName.toLowerCase() + id + cls).slice(0, 120);
  };

  const brokenImages = [];
  const distortedImages = [];
  for (const img of document.images) {
    const src = img.currentSrc || img.src || '(no src)';
    if (!img.complete || img.naturalWidth === 0) {
      brokenImages.push(src);
      continue;
    }
    const box = img.getBoundingClientRect();
    if (box.width < 4 || box.height < 4) continue;
    const objectFit = getComputedStyle(img).objectFit;
    if (objectFit !== 'fill') continue;
    const natural = img.naturalWidth / img.naturalHeight;
    const rendered = box.width / box.height;
    const skew = Math.abs(rendered - natural) / natural;
    if (skew > 0.05) {
      distortedImages.push({ src, natural: +natural.toFixed(3), rendered: +rendered.toFixed(3) });
    }
  }

  const overflowing = [];
  if (scrollWidth > viewportWidth + 1) {
    for (const el of document.body.querySelectorAll('*')) {
      const box = el.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      if (getComputedStyle(el).position === 'fixed') continue;
      if (box.right > viewportWidth + 1) {
        overflowing.push({ element: describe(el), right: Math.round(box.right) });
      }
    }
    overflowing.sort((a, b) => b.right - a.right);
  }

  return {
    viewportWidth,
    scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
    brokenImages,
    distortedImages,
    overflowing: overflowing.slice(0, 5)
  };
})()`;

async function auditPage(cdp, baseUrl, pathname, viewportName, screenshotDir) {
  const viewport = VIEWPORTS[viewportName];
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

  const requestFailures = [];
  const pageErrors = [];
  let documentStatus = null;
  const off = cdp.on((message) => {
    if (message.sessionId !== sessionId) return;
    if (message.method === 'Network.responseReceived') {
      const { response, type } = message.params;
      if (type === 'Document' && documentStatus === null) documentStatus = response.status;
      if (response.status >= 400) requestFailures.push(`${response.status} ${type} ${response.url}`);
    } else if (message.method === 'Network.loadingFailed') {
      // Analytics and other third-party beacons are routinely blocked; only our own assets matter.
      const { errorText, type } = message.params;
      if (!/net::ERR_ABORTED/.test(errorText)) requestFailures.push(`${errorText} ${type}`);
    } else if (message.method === 'Runtime.exceptionThrown') {
      pageErrors.push(message.params.exceptionDetails.text ?? 'uncaught exception');
    }
  });

  try {
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Network.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1 }, sessionId);

    const loaded = cdp.once('Page.loadEventFired', sessionId, 45000);
    await cdp.send('Page.navigate', { url: `${baseUrl}${pathname}` }, sessionId);
    await loaded;

    // Astro turns an in-page `Astro.redirect()` on a prerendered route into a meta-refresh stub. It
    // has no layout of its own and navigates away mid-audit, so there is nothing to measure.
    const refresh = await cdp.send(
      'Runtime.evaluate',
      { expression: `!!document.querySelector('meta[http-equiv="refresh" i]')`, returnByValue: true },
      sessionId
    );
    if (refresh.result.value) {
      return { path: pathname, viewport: viewportName, documentStatus, problems: [], metrics: null };
    }

    const { result, exceptionDetails } = await cdp.send(
      'Runtime.evaluate',
      { expression: AUDIT_EXPRESSION, awaitPromise: true, returnByValue: true },
      sessionId
    );
    if (exceptionDetails) throw new Error(exceptionDetails.text ?? 'audit script failed');
    const metrics = result.value;

    if (screenshotDir) {
      // Chrome silently returns an empty image past its texture limit, so long landing pages are
      // captured down to a fixed cut-off instead of in full.
      const clip = {
        x: 0,
        y: 0,
        width: viewport.width,
        height: Math.min(metrics.documentHeight, MAX_SCREENSHOT_HEIGHT),
        scale: 1
      };
      const shot = await cdp.send(
        'Page.captureScreenshot',
        { format: 'webp', quality: 80, captureBeyondViewport: true, clip },
        sessionId
      );
      const name = `${pathname.replace(/^\/|\/$/g, '').replaceAll('/', '_') || 'index'}.${viewportName}.webp`;
      await writeFile(join(screenshotDir, name), Buffer.from(shot.data, 'base64'));
    }

    const problems = [];
    if (metrics.scrollWidth > metrics.viewportWidth + 1) {
      problems.push(
        `horizontal overflow: content is ${metrics.scrollWidth}px wide in a ${metrics.viewportWidth}px viewport` +
          (metrics.overflowing.length
            ? ` (widest: ${metrics.overflowing.map((item) => item.element).join(', ')})`
            : '')
      );
    }
    if (metrics.documentHeight < 400) problems.push(`page is only ${metrics.documentHeight}px tall`);
    for (const src of metrics.brokenImages) problems.push(`image failed to load: ${src}`);
    for (const image of metrics.distortedImages) {
      problems.push(
        `image aspect ratio off: ${image.src} rendered ${image.rendered} vs natural ${image.natural}`
      );
    }
    for (const failure of requestFailures) problems.push(`request failed: ${failure}`);
    for (const error of pageErrors) problems.push(`page error: ${error}`);

    return { path: pathname, viewport: viewportName, documentStatus, problems, metrics };
  } finally {
    off();
    await cdp.send('Target.closeTarget', { targetId }).catch(() => {});
  }
}

/** A live host under load answers with these instead of the page; they say nothing about layout. */
const THROTTLED = new Set([403, 429, 503]);

async function auditWithRetry(cdp, baseUrl, pathname, viewport, screenshotDir, attempts = 5) {
  let last;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      last = await auditPage(cdp, baseUrl, pathname, viewport, screenshotDir);
      if (!THROTTLED.has(last.documentStatus)) return last;
    } catch (error) {
      last = { path: pathname, viewport, problems: [`audit error: ${error.message}`], metrics: null };
    }
    if (attempt < attempts) await new Promise((done) => setTimeout(done, 2000 * 2 ** (attempt - 1)));
  }
  return last;
}

async function collectPages(dir, pages = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await collectPages(full, pages);
    else if (entry.name === 'index.html') {
      pages.push('/' + relative(CLIENT_DIR, full).replaceAll('\\', '/').replace(/index\.html$/, ''));
    }
  }
  return pages;
}

async function selectPages(options) {
  if (options.only.length > 0) return options.only;

  let pages = (await collectPages(CLIENT_DIR)).sort();
  // `/admin/` is a CMS shell that only renders once a GitHub login succeeds.
  pages = pages.filter((pathname) => !pathname.startsWith('/admin/'));
  if (options.pages === 'lp') pages = pages.filter((pathname) => !pathname.startsWith('/blog/'));
  else if (options.pages === 'blog') pages = pages.filter((pathname) => pathname.startsWith('/blog/'));

  if (options.shard) {
    const [index, total] = options.shard.split('/').map(Number);
    pages = pages.filter((_, i) => i % total === index - 1);
  }
  return pages;
}

async function mapLimit(items, limit, worker) {
  const results = [];
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  const { baseUrl, options } = parseArgs(process.argv.slice(2));
  if (!baseUrl) {
    console.error('Usage: node scripts/visual-audit.mjs <baseUrl> [--pages all|lp|blog] [--shard n/total]');
    process.exit(2);
  }

  const pages = await selectPages(options);
  if (pages.length === 0) {
    console.error('no pages selected');
    process.exit(2);
  }
  if (options.screenshots) await mkdir(options.screenshots, { recursive: true });

  const browser = await launchChrome();
  const jobs = pages.flatMap((pathname) =>
    options.viewports.map((viewport) => ({ pathname, viewport }))
  );

  let results;
  try {
    results = await mapLimit(jobs, options.concurrency, ({ pathname, viewport }) =>
      auditWithRetry(browser.cdp, baseUrl, pathname, viewport, options.screenshots)
    );
  } finally {
    await browser.close();
  }

  const failures = results.filter((result) => result.problems.length > 0);
  const report = {
    baseUrl,
    shard: options.shard,
    checkedAt: new Date().toISOString(),
    renders: { total: results.length, failed: failures.length },
    failures: failures.map(({ path, viewport, problems }) => ({ path, viewport, problems }))
  };
  if (options.out) await writeFile(options.out, JSON.stringify(report, null, 2));

  console.log(
    `${baseUrl}${options.shard ? ` shard ${options.shard}` : ''}: ` +
      `${results.length - failures.length}/${results.length} renders clean`
  );
  for (const failure of failures.slice(0, 20)) {
    console.error(`FAIL ${failure.viewport} ${failure.path}: ${failure.problems.join('; ')}`);
  }
  if (failures.length > 0) process.exit(1);
}

// Exit 1 means "rendered everything, found problems"; a fatal error uses a distinct code so a
// caller fanning the audit out over many shards can tell the two apart.
main().catch((error) => {
  console.error(error);
  process.exit(3);
});
