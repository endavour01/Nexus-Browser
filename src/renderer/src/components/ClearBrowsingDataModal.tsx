import React, { useState } from 'react';
import { ClearDataOptions } from '@shared/types';
import { X, Trash2, RotateCw, History, Download, Cookie, HardDrive } from 'lucide-react';

interface ClearBrowsingDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClear: (options: ClearDataOptions) => Promise<void>;
}

export const ClearBrowsingDataModal: React.FC<ClearBrowsingDataModalProps> = ({
  isOpen,
  onClose,
  onClear,
}) => {
  const [timeRange, setTimeRange] = useState<ClearDataOptions['timeRange']>('24h');
  const [clearHistory, setClearHistory] = useState(true);
  const [clearDownloads, setClearDownloads] = useState(true);
  const [clearCookies, setClearCookies] = useState(false);
  const [clearCache, setClearCache] = useState(true);
  const [clearing, setClearing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClearing(true);
    try {
      await onClear({
        timeRange,
        history: clearHistory,
        downloads: clearDownloads,
        cookies: clearCookies,
        cache: clearCache,
      });
      onClose();
    } catch (err) {
      console.error('Failed to clear browsing data:', err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="nexus-modal-overlay" onClick={onClose}>
      <div className="nexus-modal-card max-w-[460px]" onClick={(e) => e.stopPropagation()}>
        <div className="nexus-modal-header">
          <div className="flex items-center gap-2">
            <Trash2 size={16} className="text-red-400" />
            <h3 className="text-sm font-semibold text-primary">Clear Browsing Data</h3>
          </div>
          <button className="nexus-icon-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Time Range Selector */}
          <div>
            <label className="text-[11px] font-medium text-secondary block mb-1">Time range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as ClearDataOptions['timeRange'])}
              className="nexus-input w-full text-xs bg-[var(--bg-elevated)]"
            >
              <option value="1h">Last hour</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="4w">Last 4 weeks</option>
              <option value="all">All time</option>
            </select>
          </div>

          {/* Selective Options */}
          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={clearHistory}
                onChange={(e) => setClearHistory(e.target.checked)}
                className="mt-0.5"
              />
              <div className="text-xs">
                <div className="flex items-center gap-1.5 font-medium text-primary">
                  <History size={13} className="text-secondary" />
                  <span>Browsing history</span>
                </div>
                <p className="text-[11px] text-muted mt-0.5">
                  Clears recorded URLs and search queries across sessions
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={clearDownloads}
                onChange={(e) => setClearDownloads(e.target.checked)}
                className="mt-0.5"
              />
              <div className="text-xs">
                <div className="flex items-center gap-1.5 font-medium text-primary">
                  <Download size={13} className="text-secondary" />
                  <span>Download history</span>
                </div>
                <p className="text-[11px] text-muted mt-0.5">
                  Clears download list entries (downloaded files on disk are preserved)
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={clearCookies}
                onChange={(e) => setClearCookies(e.target.checked)}
                className="mt-0.5"
              />
              <div className="text-xs">
                <div className="flex items-center gap-1.5 font-medium text-primary">
                  <Cookie size={13} className="text-secondary" />
                  <span>Cookies and other site data</span>
                </div>
                <p className="text-[11px] text-muted mt-0.5">
                  Signs you out of most websites and resets session partitions
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={clearCache}
                onChange={(e) => setClearCache(e.target.checked)}
                className="mt-0.5"
              />
              <div className="text-xs">
                <div className="flex items-center gap-1.5 font-medium text-primary">
                  <HardDrive size={13} className="text-secondary" />
                  <span>Cached images and files</span>
                </div>
                <p className="text-[11px] text-muted mt-0.5">
                  Frees up disk cache and forces fresh network loads
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              className="nexus-btn-secondary text-xs px-3 py-1.5"
              onClick={onClose}
              disabled={clearing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="nexus-btn-danger text-xs px-4 py-1.5 font-medium flex items-center gap-1.5"
              disabled={clearing || (!clearHistory && !clearDownloads && !clearCookies && !clearCache)}
            >
              {clearing ? (
                <>
                  <RotateCw size={12} className="animate-spin" />
                  <span>Clearing...</span>
                </>
              ) : (
                <span>Clear Data</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
