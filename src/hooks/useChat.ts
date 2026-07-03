import { useState, useEffect, useCallback, useRef } from 'react';
import { Conversation, Message } from '../types';

const api = window.electronAPI;

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null!);

  // 初始化：加载对话列表
  useEffect(() => {
    loadConversations();
  }, []);

  // 切换对话时加载消息
  useEffect(() => {
    if (currentId) {
      loadMessages(currentId);
      setStreamingContent('');
      setError(null);
    } else {
      setMessages([]);
    }
  }, [currentId]);

  // 流式响应监听
  useEffect(() => {
    const unsubChunk = api.onStreamChunk((chunk: string) => {
      setStreamingContent(prev => prev + chunk);
    });

    const unsubDone = api.onStreamDone(() => {
      setIsStreaming(false);
      setStreamingContent('');
      if (currentId) {
        loadMessages(currentId);
        loadConversations(); // 更新时间排序
      }
    });

    const unsubError = api.onStreamError((errMsg: string) => {
      setIsStreaming(false);
      setStreamingContent('');
      setError(errMsg);
    });

    return () => {
      unsubChunk();
      unsubDone();
      unsubError();
    };
  }, [currentId]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const loadConversations = useCallback(async () => {
    const convs = await api.getConversations();
    setConversations(convs);
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    const msgs = await api.getMessages(conversationId);
    setMessages(msgs);
  }, []);

  const selectConversation = useCallback((id: string) => {
    setCurrentId(id);
    setError(null);
  }, []);

  const createNewConversation = useCallback(async () => {
    const conv = await api.createConversation();
    await loadConversations();
    setCurrentId(conv.id);
  }, []);

  const deleteCurrentConversation = useCallback(async (id: string) => {
    await api.deleteConversation(id);
    await loadConversations();
    if (currentId === id) {
      setCurrentId(null);
      setMessages([]);
    }
  }, [currentId]);

  const sendMessage = useCallback(async (data: { text: string; image?: any; file?: any }) => {
    if (!currentId || isStreaming) return;
    if (!data.text.trim() && !data.image && !data.file) return;

    setError(null);
    setIsStreaming(true);
    setStreamingContent('');

    // 构建显示文本
    let displayText = data.text.trim();
    if (data.image) {
      displayText = displayText || '[图片]';
    }
    if (data.file) {
      displayText = displayText ? `[文件: ${data.file.name}]\n${displayText}` : `[文件: ${data.file.name}]`;
    }

    // 乐观更新
    const tempUserMsg: Message = {
      id: 'temp-' + Date.now(),
      conversationId: currentId,
      role: 'user',
      content: displayText,
      createdAt: Date.now(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    // 调用 IPC，传递附件信息
    const attachments: any = {};
    if (data.image) attachments.image = data.image;
    if (data.file) attachments.file = data.file;
    await api.sendMessage(currentId, displayText, Object.keys(attachments).length > 0 ? attachments : undefined);
  }, [currentId, isStreaming]);

  const importConversation = useCallback(async () => {
    const result = await api.importFromFile();
    if (result) {
      await loadConversations();
      setCurrentId(result.id);
    }
  }, []);

  return {
    conversations,
    currentId,
    messages,
    streamingContent,
    isStreaming,
    error,
    messagesEndRef,
    selectConversation,
    createNewConversation,
    deleteCurrentConversation,
    sendMessage,
    importConversation,
    setError,
  };
}
