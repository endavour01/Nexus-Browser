import { app } from 'electron';

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  const result = fn();
  if (result instanceof Promise) {
    return result
      .then(() => {
        console.log(`  ✓ ${name}`);
        passed++;
      })
      .catch((err: Error) => {
        console.error(`  ✗ ${name}: ${err.message}`);
        failed++;
      });
  }
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}

function assertEquals<T>(actual: T, expected: T, msg = '') {
  if (actual !== expected) {
    throw new Error(
      `${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function assertDefined(val: unknown, msg = '') {
  if (val === undefined || val === null) {
    throw new Error(`${msg} — value is ${val}`);
  }
}

function assertType(val: unknown, type: string, msg = '') {
  if (typeof val !== type) {
    throw new Error(`${msg} — expected type '${type}', got '${typeof val}'`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  console.log('\n══════════════════════════════════════════');
  console.log('  NEXUS Developer Tools Test Suite');
  console.log('══════════════════════════════════════════\n');

  // ── 1. ZoomManager ───────────────────────────────────────────────────────
  console.log('── ZoomManager ──');
  const { ZoomManager } = await import('../src/main/zoom-manager');
  const zm = new ZoomManager();

  await test('ZoomManager instantiates', () => {
    assertDefined(zm, 'zm');
  });

  await test('getSiteZoom returns default 1.0 for unknown host', async () => {
    const z = await zm.getSiteZoom('https://unknown.test.local');
    assertEquals(z, 1.0, 'default zoom');
  });

  await test('setSiteZoom persists and getSiteZoom retrieves value', async () => {
    await zm.setSiteZoom('https://example.com/some/path', 1.5);
    const z = await zm.getSiteZoom('https://example.com');
    assertEquals(z, 1.5, 'zoom round-trip');
  });

  await test('setSiteZoom clamps minimum to 0.25', async () => {
    await zm.setSiteZoom('https://clamp-low.test', 0.01);
    const z = await zm.getSiteZoom('https://clamp-low.test');
    assertEquals(z, 0.25, 'clamp low');
  });

  await test('setSiteZoom clamps maximum to 5.0', async () => {
    await zm.setSiteZoom('https://clamp-high.test', 99);
    const z = await zm.getSiteZoom('https://clamp-high.test');
    assertEquals(z, 5.0, 'clamp high');
  });

  await test('getAllSiteZooms returns a non-empty array', async () => {
    const all = await zm.getAllSiteZooms();
    assertEquals(Array.isArray(all), true, 'isArray');
    const found = all.find((p: any) => p.origin === 'example.com');
    assertDefined(found, 'example.com entry');
  });

  // ── 2. NetworkMonitor ─────────────────────────────────────────────────────
  console.log('\n── NetworkMonitor ──');
  const { NetworkMonitor } = await import('../src/main/network-monitor');
  const nm = new NetworkMonitor();

  await test('NetworkMonitor instantiates', () => {
    assertDefined(nm, 'nm');
  });

  await test('getLogs returns empty array for unknown tabId', () => {
    const logs = nm.getLogs('tab-nonexistent');
    assertEquals(Array.isArray(logs), true, 'isArray');
    assertEquals(logs.length, 0, 'empty');
  });

  await test('clearLogs does not throw for unknown tabId', () => {
    nm.clearLogs('tab-nonexistent');
  });

  await test('clearLogs clears existing logs', async () => {
    // Manually push a fake log entry via internal buffer
    (nm as any).buffer = new Map([['tab-1', [{ id: 'req-1', url: 'http://a.com' }]]]);
    nm.clearLogs('tab-1');
    const logs = nm.getLogs('tab-1');
    assertEquals(logs.length, 0, 'cleared');
  });

  // ── 3. ReaderArticle interface shape ─────────────────────────────────────
  console.log('\n── ReaderArticle / Types ──');
  const { } = await import('../src/shared/types'); // ensure module imports

  await test('ReaderArticle interface fields are accessible at runtime via typed obj', () => {
    const article: import('../src/shared/types').ReaderArticle = {
      title: 'Test Article',
      byline: 'Author',
      content: '<p>Hello</p>',
      textContent: 'Hello',
      length: 5,
      siteName: 'test.com',
    };
    assertDefined(article.title, 'title');
    assertDefined(article.content, 'content');
    assertEquals(article.length, 5, 'length');
  });

  await test('ReaderResult success/failure shapes are structurally valid', () => {
    const ok: import('../src/shared/types').ReaderResult = {
      success: true,
      article: {
        title: 'A',
        byline: '',
        content: '<p>x</p>',
        textContent: 'x',
        length: 1,
        siteName: 'site',
      },
    };
    const fail: import('../src/shared/types').ReaderResult = {
      success: false,
      reason: 'content too short',
    };
    assertEquals(ok.success, true, 'ok.success');
    assertEquals(fail.success, false, 'fail.success');
    assertEquals(fail.reason, 'content too short', 'fail.reason');
  });

  // ── 4. DeveloperToolsManager public API ──────────────────────────────────
  console.log('\n── DeveloperToolsManager public API ──');

  // Import and verify the class has all expected methods without instantiating
  // (instantiation requires a running TabManager+window)
  const { DeveloperToolsManager } = await import('../src/main/developer-tools-manager');

  const expectedMethods = [
    'viewPageSource',
    'getPageInfo',
    'setDeviceEmulation',
    'getCookiesForTab',
    'removeCookie',
    'getStorageForTab',
    'clearStorageForTab',
    'getNetworkLogs',
    'clearNetworkLogs',
    'extractReaderMode',
    'getSiteZoom',
    'setSiteZoom',
    'getAllSiteZooms',
    'inspectElement',
  ];

  for (const method of expectedMethods) {
    await test(`DeveloperToolsManager has method '${method}'`, () => {
      if (typeof (DeveloperToolsManager.prototype as any)[method] !== 'function') {
        throw new Error(`method '${method}' not found on prototype`);
      }
    });
  }

  // ── 5. getAllSiteZooms is stable ──────────────────────────────────────────
  console.log('\n── ZoomManager serialization ──');

  await test('ZoomManager round-trips multiple hostnames cleanly', async () => {
    const zm2 = new ZoomManager();
    zm2.setSiteZoom('https://alpha.test', 1.25);
    zm2.setSiteZoom('https://beta.test', 0.75);
    const all = zm2.getAllSiteZooms();
    const alpha = all.find((p) => p.origin === 'alpha.test');
    const beta = all.find((p) => p.origin === 'beta.test');
    if (!alpha || alpha.zoomFactor !== 1.25) throw new Error(`alpha mismatch: ${alpha?.zoomFactor}`);
    if (!beta || beta.zoomFactor !== 0.75) throw new Error(`beta mismatch: ${beta?.zoomFactor}`);
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════════\n');

  app.exit(failed > 0 ? 1 : 0);
});
