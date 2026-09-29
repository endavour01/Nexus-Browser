import React, { useState } from 'react';
import { X, Copy, Check, Trash2, Code, AlertCircle, CheckCircle } from 'lucide-react';

interface JsonFormatterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JsonFormatterModal: React.FC<JsonFormatterModalProps> = ({ isOpen, onClose }) => {
  const [inputJson, setInputJson] = useState<string>(
    '{\n  "name": "nexus-browser",\n  "status": "ready",\n  "version": 1.0,\n  "features": ["tabs", "security", "devtools"]\n}'
  );
  const [error, setError] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [stats, setStats] = useState<{ size: number; keyCount: number } | null>(null);

  if (!isOpen) return null;

  const validateAndFormat = (indent: number | string = 2) => {
    try {
      if (!inputJson.trim()) {
        setError(null);
        setStats(null);
        return;
      }
      const parsed = JSON.parse(inputJson);
      const formatted = typeof indent === 'number' ? JSON.stringify(parsed, null, indent) : JSON.stringify(parsed);
      setInputJson(formatted);
      setError(null);

      // Calculate stats
      const size = new Blob([formatted]).size;
      const countKeys = (obj: any): number => {
        if (typeof obj !== 'object' || obj === null) return 0;
        let c = Object.keys(obj).length;
        for (const k of Object.keys(obj)) {
          c += countKeys(obj[k]);
        }
        return c;
      };
      setStats({ size, keyCount: countKeys(parsed) });
    } catch (err: any) {
      setError(err.message || 'Invalid JSON syntax');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inputJson);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleClear = () => {
    setInputJson('');
    setError(null);
    setStats(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="json-formatter-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div className="modal-title-wrap">
            <Code size={18} className="text-purple" />
            <h3>JSON Formatter & Inspector</h3>
          </div>
          <button className="icon-btn-small" onClick={onClose}>
            <X size={16} />
          </button>
        </header>

        <div className="json-formatter-toolbar">
          <div className="toolbar-left">
            <button className="devtools-pill-btn" onClick={() => validateAndFormat(2)}>
              Format (2 spaces)
            </button>
            <button className="devtools-pill-btn" onClick={() => validateAndFormat(4)}>
              Format (4 spaces)
            </button>
            <button className="devtools-pill-btn" onClick={() => validateAndFormat('')}>
              Minify / 1 Line
            </button>
          </div>

          <div className="toolbar-right">
            {stats && (
              <span className="json-stats font-mono">
                {stats.size} bytes • {stats.keyCount} keys
              </span>
            )}
            <button className="devtools-pill-btn" onClick={handleCopy} title="Copy to clipboard">
              {hasCopied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
              <span>{hasCopied ? 'Copied' : 'Copy'}</span>
            </button>
            <button className="icon-btn-small text-danger" onClick={handleClear} title="Clear text">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {error && (
          <div className="json-error-banner">
            <AlertCircle size={14} />
            <span>Syntax Error: {error}</span>
          </div>
        )}

        <div className="json-editor-wrap">
          <textarea
            className="json-textarea font-mono"
            value={inputJson}
            onChange={(e) => {
              setInputJson(e.target.value);
              // Clear error while typing
              if (error) setError(null);
            }}
            placeholder="Paste raw JSON here to validate and format..."
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};
