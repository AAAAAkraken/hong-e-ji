import { contextBridge, ipcRenderer } from 'electron';

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 聊天 - 发送消息（支持图片和文件附件）
  sendMessage: (conversationId: string, content: string, attachments?: {
    image?: { name: string; data: string; mime: string };
    file?: { name: string; data: string };
  }) => ipcRenderer.invoke('send-message', conversationId, content, attachments),

  // 流式响应监听
  onStreamChunk: (callback: (chunk: string) => void) => {
    const handler = (_event: any, chunk: string) => callback(chunk);
    ipcRenderer.on('stream-chunk', handler);
    return () => ipcRenderer.removeListener('stream-chunk', handler);
  },

  onStreamDone: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('stream-done', handler);
    return () => ipcRenderer.removeListener('stream-done', handler);
  },

  onStreamError: (callback: (error: string) => void) => {
    const handler = (_event: any, error: string) => callback(error);
    ipcRenderer.on('stream-error', handler);
    return () => ipcRenderer.removeListener('stream-error', handler);
  },

  // 数据库操作
  getConversations: () => ipcRenderer.invoke('get-conversations'),
  getMessages: (conversationId: string) =>
    ipcRenderer.invoke('get-messages', conversationId),
  createConversation: (title?: string) =>
    ipcRenderer.invoke('create-conversation', title),
  deleteConversation: (id: string) =>
    ipcRenderer.invoke('delete-conversation', id),
  updateConversationTitle: (id: string, title: string) =>
    ipcRenderer.invoke('update-conversation-title', id, title),

  // 设置
  getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key: string, value: string) =>
    ipcRenderer.invoke('set-setting', key, value),

  // 导入
  importFromFile: () => ipcRenderer.invoke('import-from-file'),

  // 头像上传
  selectAvatar: () => ipcRenderer.invoke('select-avatar'),

  // 应用图标
  selectAppIcon: () => ipcRenderer.invoke('select-app-icon'),
  getAppIcon: () => ipcRenderer.invoke('get-app-icon'),

  // 聊天附件
  selectChatImage: () => ipcRenderer.invoke('select-chat-image'),
  selectChatFile: () => ipcRenderer.invoke('select-chat-file'),
});
