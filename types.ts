
export type Role = 'user' | 'system';
export type ViewState = 'landing' | 'login' | 'dashboard' | 'settings';
export type Theme = 'dark' | 'light';

export interface Message {
  id: string;
  conversation_id?: string;
  role: Role;
  content: string;
  timestamp: number;
  sources?: string[];
  animate?: boolean; // Controls typewriter effect
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export type KnowledgeType = 'document' | 'url' | 'note';

export interface KnowledgeNode {
  id: string;
  title: string;
  type: KnowledgeType;
  date: string;
  tags: string[];
  status: 'synced' | 'syncing' | 'error';
  size?: string;
  fullContent?: string;
}

export type CursorType = 'default' | 'button' | 'text';

export interface CursorContextType {
  cursorType: CursorType;
  setCursorType: (type: CursorType) => void;
}

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}
