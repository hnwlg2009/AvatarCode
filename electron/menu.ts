import { app, Menu, shell, BrowserWindow, dialog, MenuItemConstructorOptions } from 'electron';
import { electronI18n } from './i18n';

const isMac = process.platform === 'darwin';

export function createMenu(mainWindow: BrowserWindow | null): void {
  const t = (key: string) => electronI18n.t(key);
  
  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ] as MenuItemConstructorOptions[],
          },
        ]
      : []),
    {
      label: t('menu.file'),
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' },
        {
          label: t('menu.openFile'),
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow?.webContents.send('menu:open-file');
          },
        },
        {
          label: t('menu.save'),
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu:save-file');
          },
        },
        { type: 'separator' as const },
        {
          label: t('menu.newFile'),
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu:new-file');
          },
        },
      ],
    },
    {
      label: t('menu.edit'),
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' },
              { type: 'separator' },
              {
                label: t('menu.speech'),
                submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }] as MenuItemConstructorOptions[],
              },
            ]
          : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
      ] as MenuItemConstructorOptions[],
    },
    {
      label: t('menu.view'),
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: t('menu.toggleSidebar'),
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            mainWindow?.webContents.send('menu:toggle-sidebar');
          },
        },
      ] as MenuItemConstructorOptions[],
    },
    {
      label: t('menu.window'),
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front' },
              { type: 'separator' },
              { role: 'window' },
            ]
          : [{ role: 'close' }]),
      ] as MenuItemConstructorOptions[],
    },
    {
      label: t('menu.help'),
      submenu: [
        {
          label: t('menu.documentation'),
          click: async () => {
            await shell.openExternal('https://github.com/hnwlg2009/AvatarCode');
          },
        },
        {
          label: t('menu.reportIssue'),
          click: async () => {
            await shell.openExternal('https://github.com/hnwlg2009/AvatarCode/issues');
          },
        },
        { type: 'separator' },
        {
          label: t('menu.about'),
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: 'AvatarCode',
              message: `AvatarCode v${app.getVersion()}`,
              detail: 'AI-Native Code Editor - Next-generation intelligent development environment',
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
