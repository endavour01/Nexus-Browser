import React, { useState } from 'react';
import { ArrowLeft, Clock, BookOpen, Sun, Moon, Type, Check } from 'lucide-react';
import { ReaderArticle } from '../../../shared/types';

interface ReaderViewProps {
  article: ReaderArticle;
  onClose: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ article, onClose }) => {
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [fontSize, setFontSize] = useState<number>(18);

  return (
    <div className={`reader-view-container reader-theme-${theme}`}>
      {/* Top Controls Toolbar */}
      <header className="reader-toolbar">
        <button className="reader-back-btn" onClick={onClose}>
          <ArrowLeft size={16} />
          <span>Exit Reader View</span>
        </button>

        <div className="reader-meta-pill">
          <Clock size={13} />
          <span>{article.readingTimeMinutes} min read</span>
          <span className="dot">•</span>
          <span>{article.length} words</span>
        </div>

        <div className="reader-controls">
          <div className="reader-font-controls">
            <button
              className="reader-icon-btn"
              onClick={() => setFontSize((s) => Math.max(14, s - 2))}
              title="Decrease Font Size"
            >
              <span style={{ fontSize: '13px', fontWeight: 600 }}>A-</span>
            </button>
            <span className="font-size-label">{fontSize}px</span>
            <button
              className="reader-icon-btn"
              onClick={() => setFontSize((s) => Math.min(26, s + 2))}
              title="Increase Font Size"
            >
              <span style={{ fontSize: '16px', fontWeight: 600 }}>A+</span>
            </button>
          </div>

          <div className="reader-theme-selector">
            <button
              className={`theme-btn dark ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
              title="Dark Theme"
            >
              <Moon size={13} />
            </button>
            <button
              className={`theme-btn sepia ${theme === 'sepia' ? 'active' : ''}`}
              onClick={() => setTheme('sepia')}
              title="Sepia Theme"
            >
              <BookOpen size={13} />
            </button>
            <button
              className={`theme-btn light ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
              title="Light Theme"
            >
              <Sun size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Reader Content */}
      <main className="reader-body">
        <article className="reader-article" style={{ fontSize: `${fontSize}px` }}>
          <header className="reader-article-header">
            <h1 className="reader-title">{article.title}</h1>
            <div className="reader-byline">
              {article.byline && <span className="reader-author">By {article.byline}</span>}
              {article.siteName && (
                <span className="reader-site">
                  {article.byline ? ' — ' : ''}
                  {article.siteName}
                </span>
              )}
            </div>
          </header>

          <div
            className="reader-content-html"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>
      </main>
    </div>
  );
};
