import React from 'react';
import {
  Bookmark,
  CheckSquare,
  Compass,
  Download,
  FileText,
  History,
  LayoutDashboard,
  Puzzle,
  Settings,
  Terminal,
  TrendingUp,
  User,
  Bot,
} from 'lucide-react';
import { SidePanelId } from '@shared/types';

export interface SidePanelOption {
  id: SidePanelId;
  label: string;
  icon: React.ReactNode;
}

export const SIDE_PANEL_OPTIONS: SidePanelOption[] = [
  { id: 'bookmarks', label: 'Bookmarks', icon: <Bookmark size={15} /> },
  { id: 'downloads', label: 'Downloads', icon: <Download size={15} /> },
  { id: 'extensions', label: 'Extensions', icon: <Puzzle size={15} /> },
  { id: 'profiles', label: 'Profiles', icon: <User size={15} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={15} /> },
  { id: 'history', label: 'Browsing History', icon: <History size={15} /> },
  { id: 'devtools', label: 'Developer Toolkit', icon: <Terminal size={15} /> },
  { id: 'notes', label: 'NEXUS Notes', icon: <FileText size={15} /> },
  { id: 'intelligence', label: 'NEXUS Explore', icon: <Compass size={15} /> },
  { id: 'markets', label: 'NEXUS Markets', icon: <TrendingUp size={15} /> },
  { id: 'hub', label: 'NEXUS Hub', icon: <LayoutDashboard size={15} /> },
  { id: 'todo', label: 'NEXUS Todo', icon: <CheckSquare size={15} /> },
  { id: 'assistant', label: 'Nexus Bot', icon: <Bot size={15} /> },
];