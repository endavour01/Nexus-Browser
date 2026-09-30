import React, { useState, useMemo } from 'react';
import { HistoryEntry } from '@shared/types';
import {
  History as HistoryIcon,
  Search,
  Trash2,
  ExternalLink,
  Clock,
  Globe,
  Calendar,
  CheckSquare,
  Square,
} from 'lucide-react';
import { NexusState } from './NexusState';

interface HistoryPageProps {
  history: HistoryEntry[];
  onNavigate: (url: string) => void;
  onDeleteEntry: (id: string) => Promise<boolean>;
  onDeleteRange: (startTime: number, endTime: number) => Promise<number>;
  onClearAll: () => Promise<boolean>;
  onOpenClearDialog: () => void;
}

const HistoryPageComponent: React.FC<HistoryPageProps> = ({
  history,
  onNavigate,
  onDeleteEntry,
  onDeleteRange,
  onClearAll,
  onOpenClearDialog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter history entries by search query
  const filteredHistory = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return history;
    return history.filter(
      (item) => item.title.toLowerCase().includes(q) || item.url.toLowerCase().includes(q)
    );
  }, [history, searchQuery]);

  // Group by date: Today, Yesterday, Earlier this week, Older
  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: HistoryEntry[] } = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const weekAgo = today - 7 * 86400000;

    for (const item of filteredHistory) {
      let key = 'Older';
      if (item.timestamp >= today) {
        key = 'Today';
      } else if (item.timestamp >= yesterday) {
        key = 'Yesterday';
      } else if (item.timestamp >= weekAgo) {
        key = 'Earlier This Week';
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [filteredHistory]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredHistory.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredHistory.map((item) => item.id)));
    }
  };

  const handleDeleteSelected = async () => {
    for (const id of selectedIds) {
      await onDeleteEntry(id);
    }
    setSelectedIds(new Set());
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="nexus-manager-page">
      {/* Top Banner */}
      <div className="nexus-page-header">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-accent">
            <HistoryIcon size={20} />
          </div>
          <div>
            <h1 className="nexus-page-title">Browsing History</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              className="nexus-btn-sm nexus-btn-danger flex items-center gap-1.5"
              onClick={handleDeleteSelected}
            >
              <Trash2 size={13} />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          )}
          <button
            className="nexus-btn-sm nexus-btn-secondary flex items-center gap-1.5"
            onClick={onOpenClearDialog}
          >
            <Trash2 size={13} />
            <span>Clear Browsing Data...</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="nexus-history-body">
        {/* Controls Toolbar */}
        <div className="manager-toolbar">
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary"
              onClick={selectAll}
            >
              {selectedIds.size > 0 && selectedIds.size === filteredHistory.length ? (
                <CheckSquare size={14} className="text-accent" />
              ) : (
                <Square size={14} />
              )}
              <span>Select all</span>
            </button>
            <span className="text-xs text-muted">
              {filteredHistory.length} {filteredHistory.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          <div className="panel-search-box max-w-[280px]">
            <Search size={13} className="panel-search-icon" />
            <input
              type="text"
              placeholder="Search history by title or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="panel-search-input"
            />
          </div>
        </div>

        {/* History Timeline */}
        <div className="nexus-history-list">
          {filteredHistory.length === 0 ? (
            <NexusState
              variant="empty"
              title="No browsing history records found"
              description={searchQuery ? `No history entries match "${searchQuery}".` : 'Websites you visit in standard workspaces will appear here.'}
            />
          ) : (
            Object.entries(groupedHistory).map(([groupTitle, items]) => (
              <div key={groupTitle} className="history-group-block">
                <div className="history-group-header">
                  <Calendar size={12} className="text-accent" />
                  <span>{groupTitle}</span>
                  <span className="text-muted text-[10px]">({items.length})</span>
                </div>

                <div className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg overflow-hidden">
                  {items.map((item) => {
                    const isSelected = selectedIds.has(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`manager-item-row group hover:bg-[var(--bg-surface-hover)] transition-colors ${
                          isSelected ? 'bg-[var(--accent-dim)]' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <div
                          className="cursor-pointer text-secondary flex-shrink-0"
                          onClick={() => toggleSelect(item.id)}
                        >
                          {isSelected ? (
                            <CheckSquare size={13} className="text-accent" />
                          ) : (
                            <Square size={13} />
                          )}
                        </div>

                        {/* Timestamp */}
                        <div className="text-[11px] text-muted font-mono whitespace-nowrap flex items-center gap-1 min-w-[55px]">
                          <Clock size={11} className="text-secondary" />
                          <span>{formatTime(item.timestamp)}</span>
                        </div>

                        {/* Favicon / Icon */}
                        <div className="flex-shrink-0">
                          {item.favicon ? (
                            <img
                              src={item.favicon}
                              alt=""
                              className="w-4 h-4 rounded-sm object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Globe size={14} className="text-secondary" />
                          )}
                        </div>

                        {/* Title & URL */}
                        <div
                          className="min-w-0 flex-1 cursor-pointer"
                          onClick={() => onNavigate(item.url)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-primary hover:text-accent truncate">
                              {item.title}
                            </span>
                            {item.visitCount > 1 && (
                              <span className="text-[9px] px-1 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-secondary">
                                {item.visitCount} visits
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-secondary font-mono truncate block">
                            {item.url}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="nexus-icon-btn text-muted hover:text-primary"
                            onClick={() => onNavigate(item.url)}
                            title="Open URL"
                          >
                            <ExternalLink size={13} />
                          </button>
                          <button
                            className="nexus-icon-btn text-muted hover:text-red-400"
                            onClick={() => onDeleteEntry(item.id)}
                            title="Remove from history"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const HistoryPage = React.memo<HistoryPageProps>(HistoryPageComponent);
