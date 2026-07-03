// 消息角色
export type MessageRole = 'user' | 'assistant' | 'system';

// 单条消息
export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: number;
}

// 对话
export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

// DeepSeek API 请求格式
export interface DeepSeekMessage {
  role: MessageRole;
  content: string;
}

export interface DeepSeekRequest {
  model: string;
  messages: DeepSeekMessage[];
  stream: boolean;
}

// 流式响应块
export interface DeepSeekChunk {
  choices: Array<{
    delta: {
      content?: string;
      role?: string;
    };
    index: number;
    finish_reason: string | null;
  }>;
}

// 导入数据格式
export interface ImportData {
  title?: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
}

// IPC 暴露的 API 类型
export interface ElectronAPI {
  // 聊天（支持附件）
  sendMessage: (conversationId: string, content: string, attachments?: {
    image?: { name: string; data: string; mime: string };
    file?: { name: string; data: string };
  }) => Promise<void>;
  onStreamChunk: (callback: (chunk: string) => void) => () => void;
  onStreamDone: (callback: () => void) => () => void;
  onStreamError: (callback: (error: string) => void) => () => void;

  // 数据库
  getConversations: () => Promise<Conversation[]>;
  getMessages: (conversationId: string) => Promise<Message[]>;
  createConversation: (title?: string) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;

  // 设置
  getSetting: (key: string) => Promise<string | null>;
  setSetting: (key: string, value: string) => Promise<void>;

  // 导入
  importFromFile: () => Promise<Conversation | null>;

  // 头像
  selectAvatar: () => Promise<string | null>;

  // 应用图标
  selectAppIcon: () => Promise<string | null>;
  getAppIcon: () => Promise<string | null>;

  // 聊天附件
  selectChatImage: () => Promise<{ name: string; data: string; mime: string } | null>;
  selectChatFile: () => Promise<{ name: string; data: string } | null>;
}
