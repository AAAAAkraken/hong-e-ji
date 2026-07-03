import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

console.log('🚀 React 入口已加载');
console.log('electronAPI 可用:', typeof window.electronAPI !== 'undefined');

const container = document.getElementById('root');
if (container) {
  console.log('📦 找到 root 容器，开始渲染...');
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('✅ 渲染完成');
  } catch (err) {
    console.error('❌ 渲染错误:', err);
  }
} else {
  console.error('❌ 未找到 root 容器');
}
