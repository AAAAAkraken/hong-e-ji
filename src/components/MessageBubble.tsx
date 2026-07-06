import React from 'react';
import { Message } from '../types';
import katex from 'katex';
import 'katex/dist/katex.min.css';
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
    return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const renderLatex = (text: string): React.ReactNode => {
    const regex = /\$\$([\s\S]*?)\$\$|\$([^\$\n]+?)\$/g;
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let match;
    let key = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(<span key={key++}>{text.slice(lastIdx, match.index)}</span>);
      }
      const formula = match[1] || match[2];
      const isDisplay = !!match[1];
      try {
        const html = katex.renderToString(formula, { throwOnError: false, displayMode: isDisplay });
        parts.push(<span key={key++} className={isDisplay ? 'latex-display' : 'latex-inline'} dangerouslySetInnerHTML={{ __html: html }} />);
      } catch {
        parts.push(<span key={key++}>{match[0]}</span>);
      }
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < text.length) parts.push(<span key={key++}>{text.slice(lastIdx)}</span>);
    return parts.length > 0 ? parts : text;
  };

  const renderText = (text: string) => {
    return text.split('\n').map((line, i, arr) => (
      <React.Fragment key={i}>{renderLatex(line)}{i < arr.length - 1 && <br />}</React.Fragment>
    ));
  };

  const renderContent = (content: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /```(\w+)?\n?([\s\S]*?)```|`([^`]+)`/g;
    let lastIndex = 0;
    let match;
    let partIndex = 0;
    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${partIndex++}`} className="text-content">{renderText(content.slice(lastIndex, match.index))}</span>);
      }
      if (match[2] !== undefined) {
        parts.push(<pre key={`code-${partIndex++}`} className="code-block"><code>{match[2].trim()}</code></pre>);
      } else if (match[3] !== undefined) {
        parts.push(<code key={`inline-${partIndex++}`} className="inline-code">{match[3]}</code>);
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push(<span key={`text-${partIndex++}`} className="text-content">{renderText(content.slice(lastIndex))}</span>);
    }
    return parts.length > 0 ? parts : renderText(content);
  };

  return (
    <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? (userAvatar.startsWith('data:') ? <img src={userAvatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} /> : userAvatar) : (assistantAvatar.startsWith('data:') ? <img src={assistantAvatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} /> : assistantAvatar)}
      </div>
      <div className="message-body">
        <div className="message-role">{isUser ? userName : assistantName}</div>
        <div className="message-content">{renderContent(message.content)}</div>
        <div className="message-time">{formatTime(message.createdAt)}</div>
      </div>
    </div>
  );
};

export default MessageBubble;
