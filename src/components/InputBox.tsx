import React, { useState, useRef, useEffect } from 'react';
import '../styles/InputBox.css';

export interface SendData {
  text: string;
  image?: { name: string; data: string; mime: string };
  file?: { name: string; data: string };
}

interface InputBoxProps {
  onSend: (data: SendData) => void;
  disabled: boolean;
  assistantName: string;
}

const InputBox: React.FC<InputBoxProps> = ({ onSend, disabled, assistantName }) => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<SendData['image'] | null>(null);
  const [file, setFile] = useState<SendData['file'] | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    if (disabled) return;
    if (!input.trim() && !image && !file) return;
    onSend({ text: input.trim(), image: image || undefined, file: file || undefined });
    setInput('');
    setImage(null);
    setFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectImage = async () => {
    const result = await window.electronAPI.selectChatImage();
    if (result) setImage(result);
  };

  const handleSelectFile = async () => {
    const result = await window.electronAPI.selectChatFile();
    if (result) setFile(result);
  };

  return (
    <div className="input-box">
      {/* 附件预览 */}
      {image && (
        <div className="attachment-preview">
          <img src={image.data} alt={image.name} style={{ maxHeight: 120, borderRadius: 8 }} />
          <button className="attach-remove" onClick={() => setImage(null)}>×</button>
          <span className="attach-name">{image.name}</span>
        </div>
      )}
      {file && (
        <div className="attachment-preview file-preview">
          <span>📄 {file.name}</span>
          <button className="attach-remove" onClick={() => setFile(null)}>×</button>
        </div>
      )}

      <div className="input-container">
        <button
          className="btn-attach"
          onClick={handleSelectImage}
          disabled={disabled}
          title="添加图片"
        >
          🖼️
        </button>
        <button
          className="btn-attach"
          onClick={handleSelectFile}
          disabled={disabled}
          title="添加文件"
        >
          📎
        </button>
        <textarea
          ref={textareaRef}
          className="input-textarea"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={image ? '对图片说点什么...' : file ? `关于 ${file.name} 想问什么...` : '输入消息... (Enter 发送)'}
          disabled={disabled}
          rows={1}
        />
        <button
          className="btn-send"
          onClick={handleSend}
          disabled={disabled || (!input.trim() && !image && !file)}
          title="发送消息"
        >
          {disabled ? '⏳' : '➤'}
        </button>
      </div>
      <div className="input-hint">
        {disabled ? `${assistantName} 正在回复中...` : '🖼️ 图片 · 📎 文件 · Enter 发送'}
      </div>
    </div>
  );
};

export default InputBox;
