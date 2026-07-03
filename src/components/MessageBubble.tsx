import React from 'react';
import { Message } from '../types';
import '../styles/MessageBubble.css';

interface MessageBubbleProps {
  message: Message;
  assistantName: string;
  assistantAvatar: string;
  userName: string;
  userAvatar: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, assistantName, assistantAvatar, userName, userAvatar }) => {
  const isUser = message.role === 'user';

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 简单的 Markdown 代码块渲染
  const renderContent = (content: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /```(\w+)?\n?([\s\S]*?)```|`([^`]+)`/g;
    let lastIndex = 0;
    let match;
    let partIndex = 0;

    while ((match = regex.exec(content)) !== null) {
      // 添加前面的普通文本
      if (match.index > lastIndex) {
        const text = content.slice(lastIndex, match.index);
        parts.push(
          <span key={`text-${partIndex++}`} className="text-content">
            {renderText(text)}
          </span>
        );
      }

      if (match[2] !== undefined) {
        // 代码块
        parts.push(
          <pre key={`code-${partIndex++}`} className="code-block">
            <code>{match[2].trim()}</code>
          </pre>
        );
      } else if (match[3] !== undefined) {
        // 行内代码
        parts.push(
          <code key={`inline-${partIndex++}`} className="inline-code">
            {match[3]}
          </code>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // 添加剩余文本
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${partIndex++}`} className="text-content">
          {renderText(content.slice(lastIndex))}
        </span>
      );
    }

    return parts.length > 0 ? parts : renderText(content);
  };

  // 渲染普通文本（支持换行）
  const renderText = (text: string) => {
    return text.split('\n').map((line, i, arr) => (
      <React.Fragment key={i}>
        {line}
        {i < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? (
          userAvatar.startsWith('data:') ? (
            <img src={userAvatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            userAvatar
          )
        ) : (
          assistantAvatar.startsWith('data:') ? (
            <img src={assistantAvatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            assistantAvatar
          )
        )}
      </div>
      <div className="message-body">
        <div className="message-role">{isUser ? userName : assistantName}</div>
        <div className="message-content">
          {renderContent(message.content)}
        </div>
        <div className="message-time">{formatTime(message.createdAt)}</div>
      </div>
    </div>
  );
};

export default MessageBubble;
