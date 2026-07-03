import { dialog, BrowserWindow } from 'electron';
import fs from 'fs';
import {
  createConversation,
  updateConversationTitle,
  getDb,
  saveToFile,
} from './database';
import { v4 as uuidv4 } from './uuid';
import { MessageRole } from './types';

// 从文件导入聊天记录
export async function importFromFile(win: BrowserWindow): Promise<{ id: string; title: string } | null> {
  const result = await dialog.showOpenDialog(win, {
    title: '选择聊天记录文件',
    filters: [
      { name: 'JSON 文件', extensions: ['json'] },
      { name: '所有文件', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // 检测并解析不同格式
    let title: string;
    let messages: Array<{ role: string; content: string }>;

    if (Array.isArray(data)) {
      // 格式: 纯消息数组
      title = '导入的对话';
      messages = data;
    } else if (data.messages && Array.isArray(data.messages)) {
      // 格式: { title, messages }
      title = data.title || '导入的对话';
      messages = data.messages;
    } else if (data.conversations) {
      // DeepSeek 网页导出格式
      const firstConv = Array.isArray(data.conversations) ? data.conversations[0] : data.conversations;
      title = firstConv.title || '导入的对话';
      messages = firstConv.messages || [];
    } else if (data.data && Array.isArray(data.data)) {
      // 另一种可能的格式
      title = data.title || '导入的对话';
      messages = data.data;
    } else {
      throw new Error('无法识别的文件格式，请确保文件包含 messages 数组');
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('文件中没有找到消息记录');
    }

    // 验证并清理消息
    const validMessages = messages
      .filter(m => m && typeof m.role === 'string' && typeof m.content === 'string')
      .filter(m => ['user', 'assistant', 'system'].includes(m.role))
      .map(m => ({
        role: m.role as MessageRole,
        content: m.content,
      }));

    if (validMessages.length === 0) {
      throw new Error('没有找到有效的消息记录');
    }

    // 创建对话
    const conversation = createConversation(title);

    // 批量插入消息
    const database = getDb();
    const stmt = database.prepare(
      'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
    );

    const now = Date.now();
    for (let i = 0; i < validMessages.length; i++) {
      const id = uuidv4();
      stmt.bind([id, conversation.id, validMessages[i].role, validMessages[i].content, now + i * 1000]);
      stmt.step();
      stmt.reset();
    }
    stmt.free();

    // 手动保存
    saveToFile();

    // 使用第一条用户消息作为标题
    if (title === '导入的对话') {
      const firstUserMsg = validMessages.find(m => m.role === 'user');
      if (firstUserMsg) {
        const newTitle = firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
        updateConversationTitle(conversation.id, newTitle);
        conversation.title = newTitle;
      }
    }

    return { id: conversation.id, title: conversation.title };
  } catch (error: any) {
    throw new Error(`导入失败: ${error.message}`);
  }
}
