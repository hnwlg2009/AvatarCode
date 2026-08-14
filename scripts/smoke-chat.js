// Electron E2E smoke test: Chat panel 真实 LLM 响应（LM Studio 内部端点）
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Point smoke runs at the real app's userData so IPC handlers read the same config
app.setPath('userData', path.join(app.getPath('appData'), 'avatarcode'));

const { setupLLMIpcHandlers } = require('../electron/dist/ipc/llm-handlers.js');
const { registerFileHandlers, default: pathSecurity } = require('../electron/dist/ipc/file-handlers.js');
setupLLMIpcHandlers();
registerFileHandlers();
pathSecurity.addAllowedPath(process.cwd());

let exitCode = 0;
const errors = [];

function driveChat(win) {
  const waitMs = 60000;
  return win.webContents.executeJavaScript(`
    (async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const $ = (sel) => Array.from(document.querySelectorAll(sel));

      await sleep(1500);
      const textarea = document.querySelector('textarea');
      if (!textarea) return 'NO_TEXTAREA';

      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      ).set;
      setter.call(textarea, 'Reply with exactly the word PONG.');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(300);

      const sendBtn = $('button').find((b) => /send|发送/i.test(b.textContent.trim()));
      if (!sendBtn) return 'NO_SEND_BTN|has:' + $('button').map((b) => b.textContent.trim()).join(',');

      const t0 = Date.now();
      sendBtn.click();

      let msgs = [];
      let foundAssistant = false;
      while (Date.now() - t0 < ${waitMs}) {
        msgs = $('[class*="message"]')
          .map((el) => el.textContent.trim())
          .filter((t) => t.length > 0);
        if (msgs.some((m) => m.startsWith('🤖') && m.length > 10)) {
          foundAssistant = true;
          break;
        }
        if (msgs.some((m) => m.includes('API key') || m.includes('Error'))) break;
        await sleep(1000);
      }
      await sleep(2000);
      msgs = $('[class*="message"]')
        .map((el) => el.textContent.trim())
        .filter((t) => t.length > 0);

      return JSON.stringify({
        foundAssistant,
        elapsedMs: Date.now() - t0,
        messages: msgs.slice(-4),
      });
    })()
  `);
}

app.whenReady().then(() => {
  const root = process.cwd();
  const ud = app.getPath('userData');
  const keyPath = path.join(ud, 'api-keys.json');
  const fs = require('fs');
  const hasKeyFile = fs.existsSync(keyPath);
  if (!hasKeyFile) {
    console.log('USERDATA_WARN:', 'no api-keys.json at', keyPath, '- Chat test will fail on key check');
  }
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(root, 'electron', 'dist', 'preload.js'),
    },
  });

  win.webContents.on('console-message', (event, level, message) => {
    if (level >= 3) {
      errors.push(message);
    }
  });

  win.webContents.on('render-process-gone', (event, details) => {
    errors.push(`render-process-gone: ${JSON.stringify(details)}`);
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    errors.push(`did-fail-load: ${errorCode} ${errorDescription}`);
  });

  win.loadFile(path.join(root, 'dist', 'index.html')).then(async () => {
    await new Promise((r) => setTimeout(r, 4000));
    const diagnostics = await win.webContents.executeJavaScript(`
      (async () => {
        const llm = window.electronAPI?.llm;
        if (!llm) return 'NO_LLM_API';
        let has = 'error';
        try { has = await llm.hasAPIKey('openai'); } catch (e) { has = 'ERR:' + e.message; }
        const h3 = document.querySelector('aside h3')?.textContent || 'NO_H3';
        return JSON.stringify({ hasOpenAI: has, chatTitle: h3, navLang: navigator.language });
      })()
    `);
    const chatResult = await driveChat(win);
    console.log(`SMOKE_CHAT_DIAG: ${diagnostics}`);
    console.log(`SMOKE_CHAT_RESULT: ${chatResult}`);
    if (errors.length > 0) {
      console.log('SMOKE_ERRORS:');
      errors.forEach((e) => console.log(`  - ${e}`));
      exitCode = 1;
    } else {
      console.log('SMOKE_OK: no renderer errors');
    }
    app.exit(exitCode);
  });
});