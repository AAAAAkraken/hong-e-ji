// Electron 主进程使用的类型定义
export type MessageRole = 'user' | 'assistant' | 'system';

// DeepSeek 消息内容：纯文本或包含图片的多模态
export type DeepSeekContent = string | Array<{
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}>;

export interface DeepSeekMessage {
  role: MessageRole;
  content: DeepSeekContent;
}

// 发送消息时附带的附件
export interface Attachment {
  type: 'image' | 'file';
  name: string;
  data: string; // base64 for images, text content for files
  mime?: string;
}
