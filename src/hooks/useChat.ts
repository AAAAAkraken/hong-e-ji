import { useState, useEffect, useCallback, useRef } from 'react';
import { Conversation, Message } from '../types';

const api = window.electronAPI;

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingConvId, setStreamingConvId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null!);
  const streamingConvRef = useRef<string | null>(null);

  const loadConversations = useCallback(async () => {
    const convs = await api.getConversations();
    setConversations(convs);
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    const msgs = await api.getMessages(conversationId);
    setMessages(msgs);
  }, []);

  const selectConversation = useCallback((id: string) => {
    if (isStreaming) setStreamingContent('');
    setCurrentId(id);
    setError(null);
  }, [isStreaming]);

  const createNewConversation = useCallback(async () => {
    const conv = await api.createConversation();
    await loadConversations();
    if (isStreaming) setStreamingContent('');
    setCurrentId(conv.id);
  }, [isStreaming, loadConversations]);

  const deleteCurrentConversation = useCallback(async (id: string) => {
    await api.deleteConversation(id);
    await loadConversations();
    if (currentId === id) {
      setCurrentId(null);
      setMessages([]);
    }
  }, [currentId, loadConversations]);

  const renameConversation = useCallback(async (id: string, title: string) => {
    await api.updateConversationTitle(id, title);
    await loadConversations();
  }, [loadConversations]);

  const sendMessage = useCallback(async (data: { text: string; image?: any; file?: any }) => {
    if (!currentId || isStreaming) return;
    if (!data.text.trim() && !data.image && !data.file) return;

    setError(null);
    setIsStreaming(true);
    setStreamingContent('');
    streamingConvRef.current = currentId;
    setStreamingConvId(currentId);

    let displayText = data.text.trim();
    if (data.image) displayText = displayText || '[图片]';
    if (data.file) displayText = displayText ? `[文件: ${data.file.name}]\n${displayText}` : `[文件: ${data.file.name}]`;

    const tempUserMsg: Message = {
      id: 'temp-' + Date.now(),
      conversationId: currentId,
      role: 'user',
      content: displayText,
      createdAt: Date.now(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

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
  }, [loadConversations]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (currentId) { loadMessages(currentId); } else { setMessages([]); }
    if (currentId !== streamingConvRef.current) {
      setStreamingContent('');
      setError(null);
    }
  }, [currentId, loadMessages]);

  useEffect(() => {
    const unsubChunk = api.onStreamChunk((chunk: string) => {
      setStreamingContent(prev => prev + chunk);
    });
    const unsubDone = api.onStreamDone(() => {
      const convId = streamingConvRef.current;
      setIsStreaming(false);
      setStreamingContent('');
      setStreamingConvId(null);
      streamingConvRef.current = null;
      if (convId) { loadMessages(convId); loadConversations(); }
    });
    const unsubError = api.onStreamError((errMsg: string) => {
      setIsStreaming(false);
      setStreamingContent('');
      setStreamingConvId(null);
      streamingConvRef.current = null;
      setError(errMsg);
    });
    return () => { unsubChunk(); unsubDone(); unsubError(); };
  }, [loadMessages, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  return {
    conversations, currentId, messages, streamingContent, streamingConvId,
    isStreaming, error, messagesEndRef, selectConversation, createNewConversation,
    deleteCurrentConversation, renameConversation, sendMessage, importConversation, setError,
  };
}
