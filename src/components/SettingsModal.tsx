import React, { useState, useEffect } from 'react';
import '../styles/Modal.css';

interface SettingsModalProps {
  onClose: () => void;
  onSaved?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onSaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('deepseek-chat');
  const [assistantName, setAssistantName] = useState('DeepSeek');
  const [assistantAvatar, setAssistantAvatar] = useState('🤖');
  const [userName, setUserName] = useState('你');
  const [userAvatar, setUserAvatar] = useState('👤');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const savedKey = await window.electronAPI.getSetting('api_key');
      const savedModel = await window.electronAPI.getSetting('model');
      const savedName = await window.electronAPI.getSetting('assistant_name');
      const savedAvatar = await window.electronAPI.getSetting('assistant_avatar');
      const savedUserName = await window.electronAPI.getSetting('user_name');
      const savedUserAvatar = await window.electronAPI.getSetting('user_avatar');
      if (savedKey) setApiKey(savedKey);
      if (savedModel) setModel(savedModel);
      if (savedName) setAssistantName(savedName);
      if (savedAvatar) setAssistantAvatar(savedAvatar);
      if (savedUserName) setUserName(savedUserName);
      if (savedUserAvatar) setUserAvatar(savedUserAvatar);
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    await window.electronAPI.setSetting('api_key', apiKey);
    await window.electronAPI.setSetting('model', model);
    await window.electronAPI.setSetting('assistant_name', assistantName);
    await window.electronAPI.setSetting('assistant_avatar', assistantAvatar);
    await window.electronAPI.setSetting('user_name', userName);
    await window.electronAPI.setSetting('user_avatar', userAvatar);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
      if (onSaved) onSaved();
    }, 1000);
  };

  const avatarOptions = ['🤖', '🌸', '🌙', '💜', '🦋', '✨', '🌿', '🐱', '🎀', '💎'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ 设置</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>AI 助手名称</label>
            <input
              type="text"
              value={assistantName}
              onChange={e => setAssistantName(e.target.value)}
              className="form-input"
              placeholder="例如：红萼、小笛"
            />
          </div>

          <div className="form-group">
            <label>AI 助手头像</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px', alignItems: 'center' }}>
              {avatarOptions.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setAssistantAvatar(emoji)}
                  style={{
                    fontSize: '24px',
                    padding: '6px 10px',
                    border: assistantAvatar === emoji ? '2px solid var(--accent)' : '2px solid transparent',
                    borderRadius: '8px',
                    background: assistantAvatar === emoji ? 'var(--accent-light)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {emoji}
                </button>
              ))}
              <button
                onClick={async () => {
                  const dataUrl = await window.electronAPI.selectAvatar();
                  if (dataUrl) setAssistantAvatar(dataUrl);
                }}
                style={{
                  padding: '8px 14px',
                  border: '1px dashed var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                📁 上传照片
              </button>
            </div>
            {assistantAvatar.startsWith('data:') && (
              <img
                src={assistantAvatar}
                alt="头像预览"
                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', marginTop: 4 }}
              />
            )}
            <p className="form-hint">点击选择表情，或上传自己的照片作为头像</p>
          </div>

          <div className="form-group">
            <label>应用图标</label>
            <button
              onClick={async () => {
                const path = await window.electronAPI.selectAppIcon();
                if (path) alert('图标已更新！');
              }}
              style={{
                padding: '10px 16px',
                border: '1px dashed var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                cursor: 'pointer',
                fontSize: '14px',
                width: '100%',
              }}
            >
              📁 选择图标文件（重启应用生效）
            </button>
            <p className="form-hint">支持 PNG、JPG、ICO 格式。更换后重启应用即可看到新图标。</p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />

          <div className="form-group">
            <label>你的名称</label>
            <input
              type="text"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              className="form-input"
              placeholder="你的名字"
            />
          </div>

          <div className="form-group">
            <label>你的头像</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px', alignItems: 'center' }}>
              {avatarOptions.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setUserAvatar(emoji)}
                  style={{
                    fontSize: '24px', padding: '6px 10px',
                    border: userAvatar === emoji ? '2px solid var(--accent)' : '2px solid transparent',
                    borderRadius: '8px',
                    background: userAvatar === emoji ? 'var(--accent-light)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                  }}
                >{emoji}</button>
              ))}
              <button
                onClick={async () => {
                  const dataUrl = await window.electronAPI.selectAvatar();
                  if (dataUrl) setUserAvatar(dataUrl);
                }}
                style={{ padding: '8px 14px', border: '1px dashed var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '13px' }}
              >📁 上传照片</button>
            </div>
            {userAvatar.startsWith('data:') && (
              <img src={userAvatar} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', marginTop: 4 }} />
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />

          <div className="form-group">
            <label htmlFor="api-key">DeepSeek API Key</label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="form-input"
            />
            <p className="form-hint">
              仅存储在本地，不上传第三方。
              <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer">
                获取 API Key →
              </a>
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="model">模型选择</label>
            <select
              id="model"
              value={model}
              onChange={e => setModel(e.target.value)}
              className="form-select"
            >
              <option value="deepseek-chat">deepseek-chat</option>
              <option value="deepseek-reasoner">deepseek-reasoner</option>
            </select>
          </div>
        </div>

        <div className="modal-footer">
          {saved && <span className="save-success">✅ 设置已保存</span>}
          <button className="btn-cancel" onClick={onClose}>取消</button>
          <button className="btn-save" onClick={handleSave}>保存设置</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
