// Electron E2E smoke test: 启动应用 → Agent tab → 发送消息 → 验证 mock 链路
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Point smoke runs at the real app's userData so IPC handlers read the same config
app.setPath('userData', path.join(app.getPath('appData'), 'avatarcode'));

// 注册真实主进程 IPC handler（与 electron/dist/main.js 相同逻辑）
const { setupLLMIpcHandlers } = require('../electron/dist/ipc/llm-handlers.js');
const { registerFileHandlers, default: pathSecurity } = require('../electron/dist/ipc/file-handlers.js');
setupLLMIpcHandlers();
registerFileHandlers();
// 授权项目根目录，供 agent 工具读取真实文件
pathSecurity.addAllowedPath(process.cwd());

let exitCode = 0;
const errors = [];

function driveAgent(win) {
  return win.webContents.executeJavaScript(`
    (async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      const tabs = Array.from(document.querySelectorAll('button'));
      const agentTab = tabs.find((b) => b.textContent.trim() === 'Agent');
      if (!agentTab) return 'NO_AGENT_TAB';
      agentTab.click();
      await sleep(500);

      const textarea = document.querySelector('textarea');
      if (!textarea) return 'NO_TEXTAREA';

      const root = document.getElementById('root');
      const rootPath = root ? 'D:/github/AvatarCode' : 'D:/github/AvatarCode';
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      ).set;
      setter.call(textarea, 'Read the file ' + rootPath + '/README.md and summarize it');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(300);

      const sendBtn = Array.from(document.querySelectorAll('button')).find(
        (b) => /send|发送/i.test(b.textContent.trim())
      );
      if (!sendBtn) return 'NO_SEND_BTN' + '| has:' + Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).join(',');
      sendBtn.click();

      const t0 = Date.now();
      let done = false;
      while (Date.now() - t0 < 60000) {
        const texts = Array.from(document.querySelectorAll('[class*="message"]'))
          .map((el) => el.textContent.trim());
        if (texts.some((t) => t.startsWith('🤖 Agent'))) { done = true; break; }
        if (texts.some((t) => t.startsWith('Error:'))) { done = true; break; }
        await sleep(1500);
      }

      const msgs = Array.from(document.querySelectorAll('[class*="message"]'))
        .map((el) => el.textContent.trim())
        .filter((t) => t.length > 0 && t.length < 500);

      const toolStatuses = Array.from(document.querySelectorAll('[class*="toolStatus"], [class*="tool-status"], [class*="toolStatus"]'))
        .map((el) => el.textContent.trim());

      const raw = Array.from(document.querySelectorAll('[class*="message"]'))
        .map((el) => el.className + ' || ' + el.textContent.trim().slice(0, 120));

      return JSON.stringify({
        waitedMs: Date.now() - t0,
        done,
        msgCount: msgs.length,
        messages: msgs.slice(-4),
        toolStatuses: toolStatuses.slice(-5),
        raw: raw.slice(-8),
      });
    })()
  `);
}

app.whenReady().then(() => {
  const root = process.cwd();
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
        let gen = 'error';
        try { gen = await llm.generate('openai', [{role:'user',content:'hi'}]); } catch (e) { gen = 'ERR:' + e.message; }
        return JSON.stringify({ hasOpenAI: has, generate: gen });
      })()
    `);
    let agentResult = 'SKIPPED';
    try {
      agentResult = await driveAgent(win);
    } catch (e) {
      errors.push(`driveAgent error: ${e.message}`);
    }
    console.log(`SMOKE_AGENT_DIAG: ${diagnostics}`);
    console.log(`SMOKE_AGENT_RESULT: ${agentResult}`);
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
