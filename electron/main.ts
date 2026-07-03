import { app, BrowserWindow, ipcMain, dialog, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';
import {
  initDatabase,
  createConversation,
  getConversations,
  deleteConversation,
  updateConversationTitle,
  addMessage,
  getMessages,
  getSetting,
  setSetting,
} from './database';
import { streamChat } from './deepseek';
import { importFromFile } from './import';
import { DeepSeekMessage, DeepSeekContent } from './types';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: '红萼纪',
    icon: app.isPackaged
      ? path.join(process.resourcesPath, 'assets', 'icon.ico')
      : path.join(__dirname, '../assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 加载编译好的文件
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // 加载保存的自定义图标
  const savedIcon = getSetting('app_icon');
  if (savedIcon && fs.existsSync(savedIcon)) {
    mainWindow.setIcon(nativeImage.createFromPath(savedIcon));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 注册所有 IPC 处理器
function registerIpcHandlers(): void {
  ipcMain.handle('get-conversations', () => {
    return getConversations();
  });

  ipcMain.handle('get-messages', (_event, conversationId: string) => {
    return getMessages(conversationId);
  });

  ipcMain.handle('create-conversation', (_event, title?: string) => {
    return createConversation(title);
  });

  ipcMain.handle('delete-conversation', (_event, id: string) => {
    deleteConversation(id);
    return;
  });

  ipcMain.handle('update-conversation-title', (_event, id: string, title: string) => {
    updateConversationTitle(id, title);
    return;
  });

  ipcMain.handle('get-setting', (_event, key: string) => {
    return getSetting(key);
  });

  ipcMain.handle('set-setting', (_event, key: string, value: string) => {
    setSetting(key, value);
    return;
  });

  ipcMain.handle('select-avatar', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择头像图片',
      filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }],
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const buf = fs.readFileSync(result.filePaths[0]);
    const ext = path.extname(result.filePaths[0]).slice(1);
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    return `data:image/${mime};base64,${buf.toString('base64')}`;
  });

  // 应用图标：选择并设置
  ipcMain.handle('select-app-icon', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择应用图标',
      filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'ico'] }],
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const srcPath = result.filePaths[0];
    // 复制到 assets 目录
    const destDir = path.join(app.isPackaged ? process.resourcesPath : __dirname, app.isPackaged ? 'assets' : '../assets');
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const ext = path.extname(srcPath);
    const destPath = path.join(destDir, `app_icon${ext}`);
    fs.copyFileSync(srcPath, destPath);
    // 保存路径
    setSetting('app_icon', destPath);
    // 立即应用
    mainWindow.setIcon(nativeImage.createFromPath(destPath));
    return destPath;
  });

  ipcMain.handle('get-app-icon', () => {
    return getSetting('app_icon');
  });

  // 选择图片添加到聊天
  ipcMain.handle('select-chat-image', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择图片',
      filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }],
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const buf = fs.readFileSync(result.filePaths[0]);
    const ext = path.extname(result.filePaths[0]).slice(1);
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    return {
      name: path.basename(result.filePaths[0]),
      data: `data:image/${mime};base64,${buf.toString('base64')}`,
      mime: `image/${mime}`,
    };
  });

  // 选择文件读取内容
  ipcMain.handle('select-chat-file', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择文件',
      filters: [
        { name: '文本/代码', extensions: ['txt', 'md', 'js', 'ts', 'py', 'java', 'c', 'cpp', 'html', 'css', 'json', 'xml', 'yaml', 'yml', 'log', 'csv'] },
        { name: '所有文件', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    return {
      name: path.basename(result.filePaths[0]),
      data: content,
    };
  });

  ipcMain.handle('send-message', async (_event, conversationId: string, content: string, attachments?: {
    image?: { name: string; data: string; mime: string };
    file?: { name: string; data: string };
  }) => {
    if (!mainWindow) return;

    // 构建用户消息的数据库内容（用于显示）
    let dbContent = content;

    // 构建发给 DeepSeek 的消息内容（可能包含图片）
    let deepseekContent: DeepSeekContent = dbContent;

    if (attachments?.image) {
      // DeepSeek 暂不支持直接识别图片，将图片信息以文字形式告知
      const imageNote = `[用户发送了一张图片: ${attachments.image.name}]`;
      if (content) {
        deepseekContent = `${content}\n\n${imageNote}`;
      } else {
        deepseekContent = `${imageNote}\n请根据图片文件名猜测用户可能想问什么，并告知用户目前暂不支持直接识别图片内容，建议用户描述图片内容。`;
      }
      dbContent = content || '[图片]';
    }

    if (attachments?.file) {
      // 文件内容附加到文字中
      const fileText = `\n\n[文件: ${attachments.file.name}]\n\`\`\`\n${attachments.file.data.slice(0, 8000)}\n\`\`\``;
      if (typeof deepseekContent === 'string') {
        deepseekContent = (content || `[文件: ${attachments.file.name}]`) + fileText;
      } else {
        (deepseekContent as any[]).unshift({ type: 'text', text: fileText });
        deepseekContent = [deepseekContent[0], ...(deepseekContent as any[]).slice(1)];
      }
      dbContent = content || `[文件: ${attachments.file.name}]`;
    }

    // 保存用户消息
    addMessage(conversationId, 'user', dbContent);

    // 获取历史消息（用于上下文）
    const history = getMessages(conversationId);

    // 构建 DeepSeek API 消息列表
    // 最后一条用户消息使用多模态格式，其他使用纯文本
    const deepseekMessages: DeepSeekMessage[] = [];
    for (let i = 0; i < history.length; i++) {
      const m = history[i];
      // 最后一条消息如果是当前用户消息且有附件，使用多模态格式
      if (i === history.length - 1 && m.role === 'user' && (attachments?.image || attachments?.file)) {
        deepseekMessages.push({
          role: 'user' as const,
          content: deepseekContent,
        });
      } else {
        deepseekMessages.push({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        });
      }
    }

    const reply = await streamChat(deepseekMessages, mainWindow);

    if (reply) {
      addMessage(conversationId, 'assistant', reply);
    }
  });

  ipcMain.handle('import-from-file', async () => {
    if (!mainWindow) return null;
    try {
      return await importFromFile(mainWindow);
    } catch (error: any) {
      if (mainWindow) {
        mainWindow.webContents.send('stream-error', error.message);
      }
      return null;
    }
  });
}

app.whenReady().then(async () => {
  await initDatabase();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
