import { BrowserWindow } from 'electron';
import { getSetting } from './database';
import { DeepSeekMessage } from './types';

const BASE_URL = 'https://api.deepseek.com/v1';

function getConfig() {
  const apiKey = getSetting('api_key');
  const model = getSetting('model') || 'deepseek-chat';
  return { apiKey, model };
}

export async function streamChat(
  messages: DeepSeekMessage[],
  win: BrowserWindow
): Promise<string> {
  const { apiKey, model } = getConfig();

  if (!apiKey) {
    win.webContents.send('stream-error', '请先在设置中配置 DeepSeek API Key');
    return '';
  }

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg: string;
      try {
        const err = JSON.parse(errorText);
        errorMsg = err.error?.message || `请求失败 (${response.status})`;
      } catch {
        errorMsg = `请求失败 (${response.status}): ${errorText}`;
      }
      win.webContents.send('stream-error', errorMsg);
      return '';
    }

    const reader = response.body?.getReader();
    if (!reader) {
      win.webContents.send('stream-error', '无法读取响应流');
      return '';
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          win.webContents.send('stream-done');
          return fullContent;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullContent += content;
            win.webContents.send('stream-chunk', content);
          }
        } catch {
          // skip
        }
      }
    }

    win.webContents.send('stream-done');
    return fullContent;
  } catch (error: any) {
    win.webContents.send('stream-error', `网络错误: ${error.message}`);
    return '';
  }
}
