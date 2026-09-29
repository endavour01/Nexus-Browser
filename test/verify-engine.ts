import { app, BrowserWindow, WebContentsView } from 'electron';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.disableHardwareAcceleration();
}

app.whenReady().then(async () => {
  console.log('Testing NEXUS Browser engine & WebContentsView...');

  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const view = new WebContentsView({
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.contentView.addChildView(view);
  view.setBounds({ x: 0, y: 84, width: 1024, height: 684 });

  console.log('✓ BrowserWindow and WebContentsView created successfully');

  view.webContents.on('did-finish-load', () => {
    const url = view.webContents.getURL();
    const title = view.webContents.getTitle();
    console.log(`✓ WebContentsView loaded URL: ${url}`);
    console.log(`✓ Page title: ${title}`);
    console.log('✓ Real browsing engine verified successfully!');
    win.destroy();
    app.quit();
    process.exit(0);
  });

  view.webContents.on('did-fail-load', (_e, errorCode, errorDesc) => {
    console.error(`✗ Load failed: ${errorCode} ${errorDesc}`);
    win.destroy();
    app.quit();
    process.exit(1);
  });

  console.log('Navigating WebContentsView to https://example.com...');
  try {
    await view.webContents.loadURL('https://example.com');
  } catch (err) {
    console.error('✗ Navigation error:', err);
    process.exit(1);
  }
});
