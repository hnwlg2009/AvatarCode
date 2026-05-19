"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMenu = createMenu;
const electron_1 = require("electron");
const i18n_1 = require("./i18n");
const isMac = process.platform === 'darwin';
function createMenu(mainWindow) {
    const t = (key) => i18n_1.electronI18n.t(key);
    const template = [
        ...(isMac
            ? [
                {
                    label: electron_1.app.name,
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
                    ],
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
                { type: 'separator' },
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
                            submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
                        },
                    ]
                    : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
            ],
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
            ],
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
            ],
        },
        {
            label: t('menu.help'),
            submenu: [
                {
                    label: t('menu.documentation'),
                    click: async () => {
                        await electron_1.shell.openExternal('https://github.com/hnwlg2009/AvatarCode');
                    },
                },
                {
                    label: t('menu.reportIssue'),
                    click: async () => {
                        await electron_1.shell.openExternal('https://github.com/hnwlg2009/AvatarCode/issues');
                    },
                },
                { type: 'separator' },
                {
                    label: t('menu.about'),
                    click: () => {
                        electron_1.dialog.showMessageBox({
                            type: 'info',
                            title: 'AvatarCode',
                            message: `AvatarCode v${electron_1.app.getVersion()}`,
                            detail: 'AI-Native Code Editor - Next-generation intelligent development environment',
                            buttons: ['OK'],
                        });
                    },
                },
            ],
        },
    ];
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
}
