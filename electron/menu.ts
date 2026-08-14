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
        isMac ? { label: t('menu.close'), role: 'close' } : { label: t('menu.quit'), role: 'quit' },
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
        { label: t('menu.undo'), role: 'undo' },
        { label: t('menu.redo'), role: 'redo' },
        { type: 'separator' },
        { label: t('menu.cut'), role: 'cut' },
        { label: t('menu.copy'), role: 'copy' },
        { label: t('menu.paste'), role: 'paste' },
        ...(isMac
          ? [
              { label: t('menu.pasteAndMatchStyle'), role: 'pasteAndMatchStyle' },
              { label: t('menu.delete'), role: 'delete' },
              { label: t('menu.selectAll'), role: 'selectAll' },
              { type: 'separator' },
              {
                label: t('menu.speech'),
                submenu: [
                  { label: t('menu.startSpeaking'), role: 'startSpeaking' },
                  { label: t('menu.stopSpeaking'), role: 'stopSpeaking' },
                ] as MenuItemConstructorOptions[],
              },
            ]
          : [
              { label: t('menu.delete'), role: 'delete' },
              { type: 'separator' },
              { label: t('menu.selectAll'), role: 'selectAll' },
            ]),
      ] as MenuItemConstructorOptions[],
    },
    {
      label: t('menu.view'),
      submenu: [
        { label: t('menu.reload'), role: 'reload' },
        { label: t('menu.toggleDevTools'), role: 'toggleDevTools' },
        { type: 'separator' },
        { label: t('menu.resetZoom'), role: 'resetZoom' },
        { label: t('menu.zoomIn'), role: 'zoomIn' },
        { label: t('menu.zoomOut'), role: 'zoomOut' },
        { label: t('menu.toggleFullScreen'), role: 'togglefullscreen' },
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
        { label: t('menu.minimize'), role: 'minimize' },
        { label: t('menu.zoom'), role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' },
              { label: t('menu.front'), role: 'front' },
              { type: 'separator' },
              { role: 'window' },
            ]
          : [{ label: t('menu.close'), role: 'close' }]),
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
              detail: t('menu.aboutDetail'),
              buttons: [t('menu.ok')],
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
