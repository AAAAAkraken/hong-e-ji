import React, { useState } from 'react';
import { Conversation } from '../types';
import '../styles/Sidebar.css';

interface SidebarProps {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onSettings: () => void;
  onImport: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  currentId,
  onSelect,
  onNew,
  onDelete,
  onSettings,
  onImport,
}) => {
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">红萼纪</h1>
        <button className="btn-new" onClick={onNew} title="新建对话">
          + 新建对话
        </button>
      </div>

      <div className="sidebar-search">
        <input
          type="text"
          placeholder="搜索对话..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="conversation-list">
        {filtered.length === 0 ? (
          <div className="empty-list">
            {search ? '未找到匹配的对话' : '暂无对话，点击上方按钮开始'}
          </div>
        ) : (
          filtered.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${conv.id === currentId ? 'active' : ''}`}
              onClick={() => onSelect(conv.id)}
            >
              <div className="conversation-info">
                <div className="conversation-title">{conv.title}</div>
                <div className="conversation-time">{formatTime(conv.updatedAt)}</div>
              </div>
              <button
                className={`btn-delete ${conv.id === deleteConfirm ? 'confirm' : ''}`}
                onClick={(e) => handleDelete(e, conv.id)}
                title={conv.id === deleteConfirm ? '确认删除' : '删除对话'}
              >
                {conv.id === deleteConfirm ? '确认' : '×'}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <button className="btn-footer" onClick={onImport}>
          📥 导入记录
        </button>
        <button className="btn-footer" onClick={onSettings}>
          ⚙️ 设置
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
