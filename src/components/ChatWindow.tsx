import React from 'react';
import { Message } from '../types';
import MessageBubble from './MessageBubble';
import InputBox, { SendData } from './InputBox';
import '../styles/ChatWindow.css';

interface ChatWindowProps {
  messages: Message[];
  streamingContent: string;
  streamingConvId: string | null;
  isStreaming: boolean;
  error: string | null;
  currentId: string | null;
  onSend: (data: SendData) => void;
  onDismissError: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  assistantName: string;
  assistantAvatar: string;
  userName: string;
  userAvatar: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  streamingContent,
  streamingConvId,
  isStreaming,
  error,
  currentId,
  onSend,
  onDismissError,
  messagesEndRef,
  assistantName,
  assistantAvatar,
  userName,
  userAvatar,
}) => {
  if (!currentId) {
    return (
      <div className="chat-window">
        <div className="chat-empty">
          <div className="empty-icon">💬</div>
          <h2>红萼纪</h2>
          <p className="empty-epigraph">红萼一纪，念念有你</p>
          <p>选择一个对话，或创建一个新对话开始聊天</p>
          <p className="empty-hint">你的所有数据都存储在本地，完全隐私安全</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="message-list">
        {messages.length === 0 && !isStreaming && (
          <div className="chat-start">
            <p>发送消息开始与 {assistantName} 对话</p>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            assistantName={assistantName}
            assistantAvatar={assistantAvatar}
            userName={userName}
            userAvatar={userAvatar}
          />
        ))}

        {isStreaming && streamingConvId === currentId && (
          <div className="message-bubble assistant">
            <div className="message-avatar">
              {assistantAvatar.startsWith('data:')
                ? <img src={assistantAvatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                : assistantAvatar}
            </div>
            <div className="message-body">
              <div className="message-role">{assistantName}</div>
              <div className="message-content">
                {streamingContent || (
                  <span className="typing-indicator">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <span className="error-text">❌ {error}</span>
            <button className="error-dismiss" onClick={onDismissError}>×</button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <InputBox onSend={onSend} disabled={isStreaming} assistantName={assistantName} />
    </div>
  );
};

export default ChatWindow;
