import React, { useState } from 'react';
import { FeedbackCategory, NexusFeedback } from '@shared/types';
import {
  MessageSquare,
  Bug,
  Lightbulb,
  CheckCircle2,
  Copy,
  Save,
  Check,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Button, Input } from '../ui';

export const FeedbackView: React.FC = () => {
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState<boolean>(true);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generateDiagnosticBundle = () => {
    return {
      app: 'NEXUS Browser v1.0.0',
      timestamp: new Date().toISOString(),
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
    };
  };

  const handleCopyDiagnostics = () => {
    const diag = generateDiagnosticBundle();
    const formatted = `=== NEXUS Feedback Report ===
Category: ${category.toUpperCase()}
Title: ${title || '(None provided)'}
Description:
${description || '(None provided)'}

Diagnostics:
${JSON.stringify(diag, null, 2)}
=============================`;

    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMessage('Please provide both a title and description.');
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);

    try {
      if (window.nexusAPI?.submitFeedback) {
        const diag = includeDiagnostics ? generateDiagnosticBundle() : undefined;
        const res = await window.nexusAPI.submitFeedback({
          category,
          title: title.trim(),
          description: description.trim(),
          includeDiagnostics,
          diagnostics: diag,
        });

        if (res.success) {
          setSubmittedId(res.id);
          setTitle('');
          setDescription('');
        }
      } else {
        // Fallback: Copy to clipboard
        handleCopyDiagnostics();
        setSubmittedId('local-clipboard');
      }
    } catch (err: any) {
      console.error('Failed to submit feedback:', err);
      setErrorMessage(err?.message || 'Could not save feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="settings-section-block" style={{ maxWidth: '680px' }}>
      {/* Header */}
      <div className="settings-group-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={20} className="text-accent" />
          <h2 className="settings-header-title" style={{ fontSize: '18px' }}>Feedback & Diagnostics</h2>
        </div>
        <p className="settings-header-desc" style={{ marginTop: '2px' }}>
          Report issues, propose workflow enhancements, or share feedback. Submissions are saved strictly to your local logs (<code className="text-accent" style={{ fontFamily: 'var(--font-mono, monospace)' }}>nexus-feedback.json</code>) or copied directly to your clipboard.
        </p>
      </div>

      {submittedId && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} style={{ color: '#34d399' }} />
            <span>Thank you! Your feedback has been saved locally ({submittedId}).</span>
          </div>
          <button
            type="button"
            style={{ fontSize: '11px', color: 'var(--nexus-text-secondary, #9298A8)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => setSubmittedId(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.3)', background: 'rgba(244, 63, 94, 0.1)', color: '#fb7185', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={15} style={{ color: '#fb7185', flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="settings-group-card">
        {/* Category Tabs */}
        <div className="settings-row-stacked">
          <label className="settings-row-label">Category</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', paddingTop: '4px' }}>
            <button
              type="button"
              className={`settings-nav-btn ${category === 'bug' ? 'active' : ''}`}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontWeight: 600,
                border: category === 'bug' ? '1px solid var(--nexus-accent-primary, #A78BFA)' : '1px solid var(--nexus-border-subtle, #1C202C)',
                background: category === 'bug' ? 'rgba(167, 139, 250, 0.12)' : 'transparent',
              }}
              onClick={() => setCategory('bug')}
            >
              <Bug size={14} className={category === 'bug' ? 'text-accent' : ''} />
              <span>Bug Report</span>
            </button>

            <button
              type="button"
              className={`settings-nav-btn ${category === 'feature' ? 'active' : ''}`}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontWeight: 600,
                border: category === 'feature' ? '1px solid var(--nexus-accent-primary, #A78BFA)' : '1px solid var(--nexus-border-subtle, #1C202C)',
                background: category === 'feature' ? 'rgba(167, 139, 250, 0.12)' : 'transparent',
              }}
              onClick={() => setCategory('feature')}
            >
              <Lightbulb size={14} className={category === 'feature' ? 'text-accent' : ''} />
              <span>Feature Idea</span>
            </button>

            <button
              type="button"
              className={`settings-nav-btn ${category === 'general' ? 'active' : ''}`}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontWeight: 600,
                border: category === 'general' ? '1px solid var(--nexus-accent-primary, #A78BFA)' : '1px solid var(--nexus-border-subtle, #1C202C)',
                background: category === 'general' ? 'rgba(167, 139, 250, 0.12)' : 'transparent',
              }}
              onClick={() => setCategory('general')}
            >
              <FileText size={14} className={category === 'general' ? 'text-accent' : ''} />
              <span>General</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="settings-row-stacked">
          <label className="settings-row-label">Summary / Title</label>
          <Input
            size="sm"
            placeholder={
              category === 'bug'
                ? 'e.g. Tab strip overflow when opening 20 tabs'
                : category === 'feature'
                ? 'e.g. Add keyboard shortcut for clearing history'
                : 'e.g. Impressions of the new three-mode design'
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Details */}
        <div className="settings-row-stacked">
          <label className="settings-row-label">Details & Steps to Reproduce</label>
          <textarea
            rows={5}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid var(--nexus-border-subtle, #1C202C)',
              background: 'var(--nexus-bg-surface, var(--bg-surface, #12151D))',
              color: 'var(--nexus-text-primary, #F4F4F5)',
              outline: 'none',
              lineHeight: 1.5,
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
            placeholder="Provide context, what you expected, and what actually occurred..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Diagnostic Attachment Checkbox */}
        <div className="settings-row" style={{ padding: '4px 0' }}>
          <div className="settings-row-label-group">
            <div className="settings-row-label" style={{ fontSize: '12px' }}>Attach diagnostic environment bundle</div>
            <div className="settings-row-desc">OS platform, screen resolution, and browser build version</div>
          </div>
          <div className="settings-row-control">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={includeDiagnostics}
                onChange={(e) => setIncludeDiagnostics(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ paddingTop: '12px', borderTop: '1px solid var(--nexus-border-subtle, #1C202C)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={copied ? <Check size={12} style={{ color: '#34D399' }} /> : <Copy size={12} />}
            onClick={handleCopyDiagnostics}
            title="Copy formatted feedback bundle with diagnostics to clipboard"
          >
            {copied ? 'Copied Bundle!' : 'Copy to Clipboard'}
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={submitting}
            leftIcon={<Save size={12} />}
          >
            {submitting ? 'Saving...' : 'Save Feedback Locally'}
          </Button>
        </div>
      </form>
    </div>
  );
};
