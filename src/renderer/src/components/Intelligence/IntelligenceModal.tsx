import React, { useState, useEffect } from 'react';
import {
  X,
  Compass,
  BookOpen,
  Coins,
  Newspaper,
  Sparkles,
} from 'lucide-react';
import { DictionaryView } from './DictionaryView';
import { CurrencyConverterView } from './CurrencyConverterView';
import { NewsDashboardView } from './NewsDashboardView';

export type IntelligenceTab = 'dictionary' | 'currency' | 'news';

interface IntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: IntelligenceTab;
  initialText?: string;
  autoLookup?: boolean;
  onNavigate?: (url: string) => void;
  onSendToNotes?: (content: string, title?: string) => void;
}

export const IntelligenceModal: React.FC<IntelligenceModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'dictionary',
  initialText = '',
  autoLookup = false,
  onNavigate,
  onSendToNotes,
}) => {
  const [activeTab, setActiveTab] = useState<IntelligenceTab>(initialTab);

  // Sync tab when opening with a specific tab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="nexus-modal-overlay" onClick={onClose}>
      <div
        className="nexus-modal-content intelligence-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="intelligence-modal-header">
          <div className="flex items-center gap-2">
            <div className="intelligence-brand-icon">
              <Compass size={16} className="text-accent" />
            </div>
            <h2 className="intelligence-modal-title">NEXUS Explore</h2>
          </div>

          {/* Navigation Tabs */}
          <div className="intelligence-modal-tabs">
            <button
              className={`filter-pill ${activeTab === 'dictionary' ? 'active' : ''}`}
              onClick={() => setActiveTab('dictionary')}
            >
              <BookOpen size={13} />
              <span>Dictionary & Explainer</span>
            </button>
            <button
              className={`filter-pill ${activeTab === 'currency' ? 'active' : ''}`}
              onClick={() => setActiveTab('currency')}
            >
              <Coins size={13} />
              <span>Currency Converter</span>
            </button>
            <button
              className={`filter-pill ${activeTab === 'news' ? 'active' : ''}`}
              onClick={() => setActiveTab('news')}
            >
              <Newspaper size={13} />
              <span>Fact-Focused News</span>
            </button>
          </div>

          <button
            className="nexus-icon-btn modal-close-btn"
            onClick={onClose}
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="intelligence-modal-body">
          {activeTab === 'dictionary' && (
            <DictionaryView
              initialText={initialText}
              autoLookup={autoLookup}
              onSendToNotes={onSendToNotes}
            />
          )}

          {activeTab === 'currency' && <CurrencyConverterView />}

          {activeTab === 'news' && (
            <NewsDashboardView
              onNavigate={(url) => {
                onClose();
                onNavigate?.(url);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
