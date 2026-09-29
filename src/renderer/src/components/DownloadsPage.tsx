import React, { useState, useMemo } from 'react';
import { DownloadRecord } from '@shared/types';
import {
  Download as DownloadIcon,
  Search,
  FolderOpen,
  FileCheck,
  Pause,
  Play,
  XCircle,
  AlertCircle,
  Folder,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { NexusState } from './NexusState';

interface DownloadsPageProps {
  downloads: DownloadRecord[];
  downloadDirectory: string;
  onChangeDownloadDirectory: () => Promise<string | null>;
  onPauseDownload: (id: string) => Promise<boolean>;
  onResumeDownload: (id: string) => Promise<boolean>;
  onCancelDownload: (id: string) => Promise<boolean>;
  onOpenFile: (id: string) => Promise<boolean>;
  onShowInFolder: (id: string) => Promise<boolean>;
  onClearDownloads: () => Promise<void>;
  onRemoveDownload: (id: string) => Promise<boolean>;
}

type FilterTab = 'all' | 'progressing' | 'completed' | 'interrupted';

export const DownloadsPage: React.FC<DownloadsPageProps> = ({
  downloads,
  downloadDirectory,
  onChangeDownloadDirectory,
  onPauseDownload,
  onResumeDownload,
  onCancelDownload,
  onOpenFile,
  onShowInFolder,
  onClearDownloads,
  onRemoveDownload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');

  const filteredDownloads = useMemo(() => {
    return downloads.filter((d) => {
      // Filter by tab
      if (filter === 'progressing' && d.status !== 'progressing' && d.status !== 'paused') {
        return false;
      }
      if (filter === 'completed' && d.status !== 'completed') {
        return false;
      }
      if (
        filter === 'interrupted' &&
        d.status !== 'interrupted' &&
        d.status !== 'cancelled'
      ) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          d.filename.toLowerCase().includes(q) ||
          (d.url && d.url.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [downloads, filter, searchQuery]);

  const activeCount = useMemo(() => {
    return downloads.filter((d) => d.status === 'progressing' || d.status === 'paused').length;
  }, [downloads]);

  return (
    <div className="nexus-manager-page">
      {/* Top Banner */}
      <div className="nexus-page-header">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-accent">
            <DownloadIcon size={20} />
          </div>
          <div>
            <h1 className="nexus-page-title">Downloads</h1>
            <p className="nexus-page-subtitle">
              Monitor active downloads, access downloaded files, and configure download directory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {downloads.length > 0 && (
            <button
              className="nexus-btn-sm nexus-btn-secondary flex items-center gap-1.5"
              onClick={onClearDownloads}
            >
              <Trash2 size={13} />
              <span>Clear Completed</span>
            </button>
          )}
        </div>
      </div>

      {/* Directory Configuration Card */}
      <div className="mx-6 mt-4 p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <Folder size={15} className="text-accent flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-[11px] text-muted block">Default Download Location</span>
            <span className="text-xs font-mono text-secondary truncate block">
              {downloadDirectory || 'Default user downloads folder'}
            </span>
          </div>
        </div>
        <button
          className="nexus-btn-sm nexus-btn-secondary text-xs px-2.5 py-1"
          onClick={onChangeDownloadDirectory}
        >
          Change Folder
        </button>
      </div>

      {/* Main Body */}
      <div className="nexus-history-body">
        {/* Controls Toolbar: Tabs & Search */}
        <div className="manager-toolbar">
          <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-0.5 rounded border border-[var(--border-subtle)]">
            <button
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                filter === 'all'
                  ? 'bg-accent text-[var(--bg-base)] font-semibold'
                  : 'text-secondary hover:text-primary'
              }`}
              onClick={() => setFilter('all')}
            >
              All ({downloads.length})
            </button>
            <button
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                filter === 'progressing'
                  ? 'bg-accent text-[var(--bg-base)] font-semibold'
                  : 'text-secondary hover:text-primary'
              }`}
              onClick={() => setFilter('progressing')}
            >
              Active ({activeCount})
            </button>
            <button
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                filter === 'completed'
                  ? 'bg-accent text-[var(--bg-base)] font-semibold'
                  : 'text-secondary hover:text-primary'
              }`}
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
            <button
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                filter === 'interrupted'
                  ? 'bg-accent text-[var(--bg-base)] font-semibold'
                  : 'text-secondary hover:text-primary'
              }`}
              onClick={() => setFilter('interrupted')}
            >
              Interrupted
            </button>
          </div>

          <div className="panel-search-box max-w-[280px]">
            <Search size={13} className="panel-search-icon" />
            <input
              type="text"
              placeholder="Search downloads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="panel-search-input"
            />
          </div>
        </div>

        {/* Download Cards List */}
        <div className="p-6 space-y-3">
          {filteredDownloads.length === 0 ? (
            <NexusState
              variant="empty"
              title="No downloads match the current filter"
              description={searchQuery ? `No downloads matched "${searchQuery}".` : 'Files you download will appear here.'}
            />
          ) : (
            filteredDownloads.map((item) => {
              const isProgressing = item.status === 'progressing';
              const isPaused = item.status === 'paused';
              const isCompleted = item.status === 'completed';
              const isFailed = item.status === 'interrupted' || item.status === 'cancelled';

              return (
                <div key={item.id} className="download-card-rich">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex-shrink-0 mt-0.5">
                        {isCompleted ? (
                          <FileCheck size={18} className="text-emerald-400" />
                        ) : isFailed ? (
                          <AlertCircle size={18} className="text-red-400" />
                        ) : (
                          <DownloadIcon size={18} className="text-accent animate-pulse" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-primary truncate" title={item.filename}>
                            {item.filename}
                          </span>
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-medium ${
                              isCompleted
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : isPaused
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : isProgressing
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        {/* URL / Origin */}
                        {item.url && (
                          <span className="text-[11px] text-secondary font-mono truncate block mt-0.5">
                            {item.url}
                          </span>
                        )}

                        {/* Progress bar for progressing or paused */}
                        {(isProgressing || isPaused) && (
                          <div className="mt-2.5">
                            <div className="w-full bg-[var(--bg-elevated)] h-1.5 rounded-full overflow-hidden border border-[var(--border-subtle)]">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  isPaused ? 'bg-amber-400' : 'bg-accent'
                                }`}
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-secondary mt-1">
                              <span>
                                {item.filesize} ({item.progress}%)
                              </span>
                              {item.speed && <span className="text-accent font-mono">{item.speed}</span>}
                            </div>
                          </div>
                        )}

                        {/* Completed / Error Notes */}
                        {isCompleted && (
                          <div className="text-[10px] text-muted mt-1 flex items-center gap-2">
                            <span>Size: {item.filesize}</span>
                            <span>•</span>
                            <span>{new Date(item.startTime).toLocaleString()}</span>
                          </div>
                        )}

                        {isFailed && (
                          <div className="text-[10px] text-red-400/80 mt-1">
                            {item.stateReason || 'Download was interrupted or cancelled'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isProgressing && (
                        <button
                          className="nexus-btn-sm nexus-btn-secondary p-1.5"
                          onClick={() => onPauseDownload(item.id)}
                          title="Pause"
                        >
                          <Pause size={13} />
                        </button>
                      )}

                      {isPaused && (
                        <button
                          className="nexus-btn-sm nexus-btn-secondary p-1.5"
                          onClick={() => onResumeDownload(item.id)}
                          title="Resume"
                        >
                          <Play size={13} />
                        </button>
                      )}

                      {(isProgressing || isPaused) && (
                        <button
                          className="nexus-btn-sm nexus-btn-danger p-1.5"
                          onClick={() => onCancelDownload(item.id)}
                          title="Cancel"
                        >
                          <XCircle size={13} />
                        </button>
                      )}

                      {isCompleted && (
                        <>
                          <button
                            className="nexus-btn-sm nexus-btn-primary flex items-center gap-1 px-2.5 py-1 text-xs"
                            onClick={() => onOpenFile(item.id)}
                            title="Open File"
                          >
                            <ExternalLink size={12} />
                            <span>Open</span>
                          </button>
                          <button
                            className="nexus-btn-sm nexus-btn-secondary flex items-center gap-1 px-2 py-1 text-xs"
                            onClick={() => onShowInFolder(item.id)}
                            title="Reveal in File Manager"
                          >
                            <FolderOpen size={12} />
                            <span>Show in Folder</span>
                          </button>
                        </>
                      )}

                      <button
                        className="nexus-icon-btn text-muted hover:text-red-400 ml-1"
                        onClick={() => onRemoveDownload(item.id)}
                        title="Remove from download history"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
