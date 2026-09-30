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
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="p-5 rounded-xl border border-subtle bg-surface/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-accent" />
          <h2 className="text-lg font-bold text-primary tracking-tight">Feedback & Diagnostics</h2>
        </div>
        <p className="text-xs text-secondary mt-1 leading-relaxed">
          Report issues, propose workflow enhancements, or share feedback. Submissions are saved strictly to your local logs (<code className="text-accent font-mono">nexus-feedback.json</code>) or copied directly to your clipboard.
        </p>
      </div>

      {submittedId && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Thank you! Your feedback has been saved locally ({submittedId}).</span>
          </div>
          <button
            type="button"
            className="text-2xs text-secondary hover:text-primary underline ml-2"
            onClick={() => setSubmittedId(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={15} className="text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5 rounded-xl border border-subtle bg-surface space-y-4">
        {/* Category Tabs */}
        <div>
          <label className="block text-2xs font-semibold uppercase tracking-wider text-secondary mb-2">
            Category
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                category === 'bug'
                  ? 'border-accent bg-accent/15 text-primary font-semibold'
                  : 'border-subtle bg-base text-secondary hover:border-subtle/80 hover:text-primary'
              }`}
              onClick={() => setCategory('bug')}
            >
              <Bug size={14} className={category === 'bug' ? 'text-accent' : ''} />
              <span>Bug Report</span>
            </button>

            <button
              type="button"
              className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                category === 'feature'
                  ? 'border-accent bg-accent/15 text-primary font-semibold'
                  : 'border-subtle bg-base text-secondary hover:border-subtle/80 hover:text-primary'
              }`}
              onClick={() => setCategory('feature')}
            >
              <Lightbulb size={14} className={category === 'feature' ? 'text-accent' : ''} />
              <span>Feature Idea</span>
            </button>

            <button
              type="button"
              className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                category === 'general'
                  ? 'border-accent bg-accent/15 text-primary font-semibold'
                  : 'border-subtle bg-base text-secondary hover:border-subtle/80 hover:text-primary'
              }`}
              onClick={() => setCategory('general')}
            >
              <FileText size={14} className={category === 'general' ? 'text-accent' : ''} />
              <span>General</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-2xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
            Summary / Title
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 text-xs rounded-lg border border-subtle bg-base text-primary focus:border-accent outline-none"
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
        <div>
          <label className="block text-2xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
            Details & Steps to Reproduce
          </label>
          <textarea
            rows={5}
            className="w-full p-3 text-xs rounded-lg border border-subtle bg-base text-primary focus:border-accent outline-none leading-relaxed resize-y"
            placeholder="Provide context, what you expected, and what actually occurred..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Diagnostic Attachment Checkbox */}
        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDiagnostics}
              onChange={(e) => setIncludeDiagnostics(e.target.checked)}
              className="rounded border-subtle"
            />
            <span className="text-2xs text-secondary">
              Attach basic environment telemetry (OS platform, resolution, browser build version)
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-subtle flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="nexus-btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
            onClick={handleCopyDiagnostics}
            title="Copy formatted feedback bundle with diagnostics to clipboard"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied Bundle!' : 'Copy to Clipboard'}</span>
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="nexus-btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
          >
            <Save size={12} />
            <span>{submitting ? 'Saving...' : 'Save Feedback Locally'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
