import React, { useState } from 'react';
import '../styles/Modal.css';

interface ImportModalProps {
  onClose: () => void;
  onImport: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport }) => {
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    setImporting(true);
    await onImport();
    setImporting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📥 导入聊天记录</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="import-info">
            <h3>支持的 JSON 格式</h3>

            <div className="format-section">
              <h4>格式一：完整格式（推荐）</h4>
              <pre className="format-preview">{`{
  "title": "对话标题",
  "messages": [
    {
      "role": "user",
      "content": "你好"
    },
    {
      "role": "assistant",
      "content": "你好！有什么可以帮你的？"
    }
  ]
}`}</pre>
            </div>

            <div className="format-section">
              <h4>格式二：纯消息数组</h4>
              <pre className="format-preview">{`[
  {
    "role": "user",
    "content": "你好"
  },
  {
    "role": "assistant",
    "content": "你好！"
  }
]`}</pre>
            </div>

            <p className="import-note">
              role 必须是 "user"、"assistant" 或 "system" 之一
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>取消</button>
          <button
            className="btn-save"
            onClick={handleImport}
            disabled={importing}
          >
            {importing ? '导入中...' : '选择文件并导入'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
