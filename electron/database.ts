import initSqlJs, { SqlJsStatic, SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { v4 as uuidv4 } from './uuid';

let db: SqlJsDatabase;
let SQL: SqlJsStatic;
const DB_FILENAME = 'deepseek-chat.db';

// 获取数据库文件路径
function getDbPath(): string {
  return path.join(app.getPath('userData'), DB_FILENAME);
}

// 保存数据库到文件
function saveToFile(): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(getDbPath(), buffer);
}

// 初始化数据库
export async function initDatabase(): Promise<void> {
  SQL = await initSqlJs();
  const dbPath = getDbPath();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // 创建表
  db.run(`CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`);

  saveToFile();
}

// 查询辅助函数：执行 SELECT 并返回结果数组
function queryAll(sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);

  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// 执行 INSERT/UPDATE/DELETE 并保存
function execute(sql: string, params: any[] = []): void {
  db.run(sql, params);
  saveToFile();
}

// ========== 对话操作 ==========

export function createConversation(title?: string): { id: string; title: string; createdAt: number; updatedAt: number } {
  const id = uuidv4();
  const now = Date.now();
  const conversationTitle = title || '新对话';

  execute('INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)',
    [id, conversationTitle, now, now]);

  return { id, title: conversationTitle, createdAt: now, updatedAt: now };
}

export function getConversations(): Array<{ id: string; title: string; createdAt: number; updatedAt: number }> {
  const rows = queryAll('SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC');

  return rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function deleteConversation(id: string): void {
  execute('DELETE FROM messages WHERE conversation_id = ?', [id]);
  execute('DELETE FROM conversations WHERE id = ?', [id]);
}

export function updateConversationTitle(id: string, title: string): void {
  execute('UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?',
    [title, Date.now(), id]);
}

// ========== 消息操作 ==========

export function addMessage(conversationId: string, role: string, content: string): { id: string; conversationId: string; role: string; content: string; createdAt: number } {
  const id = uuidv4();
  const now = Date.now();

  execute('INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, conversationId, role, content, now]);

  execute('UPDATE conversations SET updated_at = ? WHERE id = ?', [now, conversationId]);

  return { id, conversationId, role, content, createdAt: now };
}

export function getMessages(conversationId: string): Array<{ id: string; conversationId: string; role: string; content: string; createdAt: number }> {
  const rows = queryAll('SELECT id, conversation_id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
    [conversationId]);

  return rows.map((r: any) => ({
    id: r.id,
    conversationId: r.conversation_id,
    role: r.role,
    content: r.content,
    createdAt: r.created_at,
  }));
}

// ========== 设置操作 ==========

export function getSetting(key: string): string | null {
  const rows = queryAll('SELECT value FROM settings WHERE key = ?', [key]);
  return rows.length > 0 ? rows[0].value : null;
}

export function setSetting(key: string, value: string): void {
  execute('DELETE FROM settings WHERE key = ?', [key]);
  execute('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
}

// 导出 db 实例和 SQL 供 import 模块使用
export function getDb(): SqlJsDatabase {
  return db;
}

export function getSQL(): SqlJsStatic {
  return SQL;
}

// 手动保存
export { saveToFile };
