import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import SettingsModal from './components/SettingsModal';
import ImportModal from './components/ImportModal';
import { useChat } from './hooks/useChat';
import './styles/App.css';

const App: React.FC = () => {
  const {
    conversations,
    currentId,
    messages,
    streamingContent,
    streamingConvId,
    isStreaming,
    error,
    messagesEndRef,
    selectConversation,
    createNewConversation,
    deleteCurrentConversation,
    sendMessage,
    importConversation,
    renameConversation,
    setError,
  } = useChat();

  const [showSettings, setShowSettings] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [assistantName, setAssistantName] = useState('DeepSeek');
  const [assistantAvatar, setAssistantAvatar] = useState('🤖');
  const [userName, setUserName] = useState('你');
  const [userAvatar, setUserAvatar] = useState('👤');

  const loadSettings = useCallback(async () => {
    const name = await window.electronAPI.getSetting('assistant_name');
    const avatar = await window.electronAPI.getSetting('assistant_avatar');
    const uname = await window.electronAPI.getSetting('user_name');
    const uavatar = await window.electronAPI.getSetting('user_avatar');
    if (name) setAssistantName(name);
    if (avatar) setAssistantAvatar(avatar);
    if (uname) setUserName(uname);
    if (uavatar) setUserAvatar(uavatar);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSettingsSaved = () => {
    loadSettings();
  };

  const handleImport = async () => {
    setShowImport(true);
  };

  const handleImportConfirm = async () => {
    await importConversation();
    setShowImport(false);
  };

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        currentId={currentId}
        onSelect={selectConversation}
        onNew={createNewConversation}
        onDelete={deleteCurrentConversation}
        onSettings={() => setShowSettings(true)}
        onRename={renameConversation}
        onImport={handleImport}
      />
      <ChatWindow
        messages={messages}
        streamingContent={streamingContent}
        streamingConvId={streamingConvId}
        isStreaming={isStreaming}
        error={error}
        currentId={currentId}
        onSend={sendMessage}
        onDismissError={() => setError(null)}
        messagesEndRef={messagesEndRef}
        assistantName={assistantName}
        assistantAvatar={assistantAvatar}
        userName={userName}
        userAvatar={userAvatar}
      />

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSaved={handleSettingsSaved}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={handleImportConfirm}
        />
      )}
    </div>
  );
};

export default App;
