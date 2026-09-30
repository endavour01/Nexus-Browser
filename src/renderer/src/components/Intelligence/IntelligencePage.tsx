import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Coins,
  Newspaper,
  ChevronLeft,
} from 'lucide-react';
import { DictionaryView } from './DictionaryView';
import { CurrencyConverterView } from './CurrencyConverterView';
import { NewsDashboardView } from './NewsDashboardView';

interface IntelligencePageProps {
  initialTab?: 'dictionary' | 'currency' | 'news';
  onNavigate?: (url: string) => void;
  onSendToNotes?: (content: string, title?: string) => void;
}

export const IntelligencePage: React.FC<IntelligencePageProps> = ({
  initialTab = 'dictionary',
  onNavigate,
  onSendToNotes,
}) => {
  const [activeTab, setActiveTab] = useState<'dictionary' | 'currency' | 'news'>(initialTab);

  return (
    <div className="nexus-fullpage-container intelligence-page-container">
      {/* Top Header */}
      <div className="intelligence-page-header">
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              className="nexus-icon-btn page-back-btn"
              onClick={() => onNavigate('nexus://newtab')}
              title="Return to Workspace"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          <div className="intelligence-brand-icon">
            <Sparkles size={18} className="text-accent" />
          </div>

          <div>
            <h1 className="page-heading">NEXUS Intelligence</h1>
            <p className="page-subheading">Contextual research, reference tools, and verifiable knowledge toolkit</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="intelligence-page-tabs">
          <button
            className={`filter-pill ${activeTab === 'dictionary' ? 'active' : ''}`}
            onClick={() => setActiveTab('dictionary')}
          >
            <BookOpen size={14} />
            <span>Dictionary & Explainer</span>
          </button>
          <button
            className={`filter-pill ${activeTab === 'currency' ? 'active' : ''}`}
            onClick={() => setActiveTab('currency')}
          >
            <Coins size={14} />
            <span>Currency Converter</span>
          </button>
          <button
            className={`filter-pill ${activeTab === 'news' ? 'active' : ''}`}
            onClick={() => setActiveTab('news')}
          >
            <Newspaper size={14} />
            <span>Fact-Focused News</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="intelligence-page-body">
        {activeTab === 'dictionary' && (
          <DictionaryView onSendToNotes={onSendToNotes} />
        )}
        {activeTab === 'currency' && <CurrencyConverterView />}
        {activeTab === 'news' && <NewsDashboardView onNavigate={onNavigate} />}
      </div>
    </div>
  );
};
