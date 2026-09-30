import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Volume2,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  Plus,
} from 'lucide-react';
import {
  ContextualExplanation,
  DictionaryWordResult,
  IntelligenceReadingLevel,
  VocabularyItem,
} from '@shared/types';
import { NexusState } from '../NexusState';

interface DictionaryViewProps {
  initialText?: string;
  autoLookup?: boolean;
  onSendToNotes?: (text: string, title?: string) => void;
  compact?: boolean;
}

export const DictionaryView: React.FC<DictionaryViewProps> = ({
  initialText = '',
  autoLookup = false,
  onSendToNotes,
  compact = false,
}) => {
  const [query, setQuery] = useState(initialText);
  const [activeTab, setActiveTab] = useState<'explainer' | 'vocabulary'>('explainer');
  const [readingLevel, setReadingLevel] = useState<IntelligenceReadingLevel>('standard');
  const [targetLanguage, setTargetLanguage] = useState<string>('en');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<ContextualExplanation | null>(null);

  // Vocabulary list
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [vocabSearch, setVocabSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const api = typeof window !== 'undefined' ? window.nexusAPI : null;

  // Load vocabulary
  const loadVocabulary = useCallback(async () => {
    if (!api) return;
    try {
      const items = await api.getVocabulary();
      setVocabulary(items || []);
    } catch (err) {
      console.error('[DictionaryView] Failed to load vocabulary:', err);
    }
  }, [api]);

  useEffect(() => {
    loadVocabulary();
  }, [loadVocabulary]);

  // Execute explanation
  const handleExplain = useCallback(
    async (textToExplain: string) => {
      const trimmed = textToExplain.trim();
      if (!trimmed || !api) return;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await api.explainSelection(trimmed, readingLevel, targetLanguage);
        setExplanation(result);
        setActiveTab('explainer');
      } catch (err: any) {
        console.error('[DictionaryView] Explanation error:', err);
        setErrorMessage(err?.message || 'Failed to explain selected text. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    },
    [api, readingLevel, targetLanguage]
  );

  // Initial lookup trigger
  useEffect(() => {
    if (initialText && (autoLookup || initialText !== query)) {
      setQuery(initialText);
      handleExplain(initialText);
    }
  }, [initialText, autoLookup, handleExplain]);

  // Check if current term is in vocabulary
  const isCurrentTermSaved = useMemo(() => {
    if (!explanation) return false;
    const term = explanation.wordResult?.word || explanation.originalText;
    return vocabulary.some((v) => v.term.toLowerCase() === term.toLowerCase());
  }, [explanation, vocabulary]);

  // Toggle saving to vocabulary
  const handleToggleVocabulary = async () => {
    if (!api || !explanation) return;
    const term = explanation.wordResult?.word || explanation.originalText;

    const existing = vocabulary.find((v) => v.term.toLowerCase() === term.toLowerCase());
    if (existing) {
      await api.deleteVocabularyItem(existing.id);
    } else {
      const def =
        explanation.wordResult?.meanings[0]?.definitions[0]?.definition ||
        explanation.simplifiedMeaning ||
        explanation.contextSummary ||
        '';
      const pos = explanation.wordResult?.meanings[0]?.partOfSpeech;
      const example = explanation.wordResult?.meanings[0]?.definitions[0]?.example;

      await api.saveVocabularyItem({
        term,
        definition: def,
        partOfSpeech: pos,
        example,
      });
    }
    loadVocabulary();
  };

  // Save specific difficult word to vocabulary
  const handleSaveSubWord = async (word: string, def: string) => {
    if (!api) return;
    await api.saveVocabularyItem({
      term: word,
      definition: def,
      partOfSpeech: 'term',
    });
    loadVocabulary();
  };

  // Delete vocabulary entry
  const handleDeleteVocab = async (id: string) => {
    if (!api) return;
    await api.deleteVocabularyItem(id);
    loadVocabulary();
  };

  // Play phonetic audio
  const handlePlayAudio = (url?: string) => {
    if (!url) return;
    try {
      const audio = new Audio(url);
      audio.play().catch((err) => console.warn('[DictionaryView] Audio playback failed:', err));
    } catch (e) {
      console.warn('[DictionaryView] Could not initialize audio:', e);
    }
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Filtered vocabulary list
  const filteredVocabulary = useMemo(() => {
    if (!vocabSearch.trim()) return vocabulary;
    const q = vocabSearch.toLowerCase();
    return vocabulary.filter(
      (v) => v.term.toLowerCase().includes(q) || v.definition.toLowerCase().includes(q)
    );
  }, [vocabulary, vocabSearch]);

  return (
    <div className={`nexus-dictionary-view ${compact ? 'compact-mode' : ''}`}>
      {/* Header Bar */}
      <div className="dictionary-header">
        <div className="flex items-center gap-2">
          <div className="dict-icon-badge">
            <BookOpen size={16} className="text-accent" />
          </div>
          <h2 className="dict-title">NEXUS Contextual Dictionary</h2>
        </div>

        {/* Tab Switcher */}
        <div className="dict-tab-group">
          <button
            className={`filter-pill ${activeTab === 'explainer' ? 'active' : ''}`}
            onClick={() => setActiveTab('explainer')}
          >
            Lookup & Explainer
          </button>
          <button
            className={`filter-pill ${activeTab === 'vocabulary' ? 'active' : ''}`}
            onClick={() => setActiveTab('vocabulary')}
          >
            Vocabulary ({vocabulary.length})
          </button>
        </div>
      </div>

      {activeTab === 'explainer' ? (
        <div className="dictionary-explainer-pane">
          {/* Search & Query Bar */}
          <form
            className="dict-search-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleExplain(query);
            }}
          >
            <div className="dict-search-input-wrapper">
              <Search size={15} className="dict-search-icon" />
              <input
                type="text"
                className="dict-search-input"
                placeholder="Enter word, phrase, sentence, or paragraph..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  className="dict-clear-btn"
                  onClick={() => {
                    setQuery('');
                    setExplanation(null);
                  }}
                  title="Clear"
                >
                  &times;
                </button>
              )}
            </div>
            <button
              type="submit"
              className="nexus-btn-primary nexus-btn-sm dict-submit-btn"
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? 'Explaining...' : 'Explain'}
            </button>
          </form>

          {/* Reading Level & Language Controls */}
          <div className="dict-controls-row">
            <div className="flex items-center gap-1.5">
              <span className="dict-ctrl-label">Reading Level:</span>
              {(['simple', 'standard', 'advanced'] as IntelligenceReadingLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  className={`dict-level-pill ${readingLevel === lvl ? 'active' : ''}`}
                  onClick={() => {
                    setReadingLevel(lvl);
                    if (query.trim()) handleExplain(query);
                  }}
                >
                  {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="dict-ctrl-label">Language:</span>
              <select
                className="dict-lang-select"
                value={targetLanguage}
                onChange={(e) => {
                  setTargetLanguage(e.target.value);
                  if (query.trim()) handleExplain(query);
                }}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>

          {/* State Displays */}
          {isLoading && (
            <NexusState
              variant="loading"
              title="Analyzing Context & Semantics..."
              description="Accessing lexicographical references and parsing grammatical structure."
              className="my-6"
            />
          )}

          {errorMessage && !isLoading && (
            <NexusState
              variant="error"
              title="Explanation Unavailable"
              description={errorMessage}
              action={
                <button
                  className="nexus-btn-secondary nexus-btn-sm mt-2"
                  onClick={() => handleExplain(query)}
                >
                  Retry Lookup
                </button>
              }
              className="my-6"
            />
          )}

          {!isLoading && !errorMessage && !explanation && (
            <NexusState
              variant="empty"
              title="Ready for Text or Selection"
              description="Highlight any word, phrase, sentence, or paragraph on any page and choose 'Explain with NEXUS', or enter a search query above."
              className="my-8"
            />
          )}

          {/* Explanation Content */}
          {!isLoading && !errorMessage && explanation && (
            <div className="dict-result-container">
              {/* Original Selection Card */}
              <div className="dict-card dict-original-card">
                <div className="dict-card-header justify-between">
                  <span className="dict-card-tag">Original Selection ({explanation.selectionType})</span>
                  <div className="flex items-center gap-1">
                    <button
                      className="nexus-icon-btn dict-tool-btn"
                      onClick={() => handleCopy(explanation.originalText, 'orig')}
                      title="Copy text"
                    >
                      {copiedId === 'orig' ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                    </button>
                    {onSendToNotes && (
                      <button
                        className="nexus-icon-btn dict-tool-btn"
                        onClick={() =>
                          onSendToNotes(
                            explanation.originalText,
                            `Note: ${explanation.wordResult?.word || explanation.originalText.slice(0, 30)}`
                          )
                        }
                        title="Send to NEXUS Notes"
                      >
                        <Plus size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="dict-original-text">"{explanation.originalText}"</div>
              </div>

              {/* Single Word View */}
              {explanation.wordResult ? (
                <div className="dict-card dict-word-card">
                  <div className="dict-word-header">
                    <div>
                      <h3 className="dict-word-title">{explanation.wordResult.word}</h3>
                      {explanation.wordResult.phonetics && explanation.wordResult.phonetics[0]?.text && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="dict-phonetic-text">{explanation.wordResult.phonetics[0].text}</span>
                          {explanation.wordResult.phonetics[0].audio && (
                            <button
                              className="dict-audio-btn"
                              onClick={() => handlePlayAudio(explanation.wordResult?.phonetics?.[0]?.audio)}
                              title="Listen to pronunciation"
                            >
                              <Volume2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      className={`dict-save-vocab-btn ${isCurrentTermSaved ? 'saved' : ''}`}
                      onClick={handleToggleVocabulary}
                      title={isCurrentTermSaved ? 'Saved in Personal Vocabulary' : 'Save to Personal Vocabulary'}
                    >
                      {isCurrentTermSaved ? (
                        <>
                          <BookmarkCheck size={14} className="text-accent" />
                          <span>Saved</span>
                        </>
                      ) : (
                        <>
                          <Bookmark size={14} />
                          <span>Save Word</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Meanings */}
                  <div className="dict-meanings-list">
                    {explanation.wordResult.meanings.map((meaning, mIdx) => (
                      <div key={mIdx} className="dict-meaning-block">
                        <div className="dict-pos-pill">{meaning.partOfSpeech}</div>
                        <ol className="dict-definitions-list">
                          {meaning.definitions.map((def, dIdx) => (
                            <li key={dIdx} className="dict-definition-item">
                              <p className="dict-def-text">{def.definition}</p>
                              {def.example && <p className="dict-example-text">"{def.example}"</p>}
                            </li>
                          ))}
                        </ol>

                        {/* Synonyms & Antonyms */}
                        {meaning.synonyms && meaning.synonyms.length > 0 && (
                          <div className="dict-synonyms-row">
                            <span className="dict-syn-label">Synonyms:</span>
                            {meaning.synonyms.map((syn, sIdx) => (
                              <button
                                key={sIdx}
                                className="dict-syn-tag"
                                onClick={() => {
                                  setQuery(syn);
                                  handleExplain(syn);
                                }}
                              >
                                {syn}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Phrase / Sentence / Paragraph View */
                <div className="dict-explanation-body">
                  {/* Simplified Meaning */}
                  {explanation.simplifiedMeaning && (
                    <div className="dict-card dict-highlight-card">
                      <div className="dict-card-header">
                        <Sparkles size={14} className="text-accent" />
                        <span className="dict-card-title">Plain Language Breakdown</span>
                      </div>
                      <p className="dict-simple-text">{explanation.simplifiedMeaning}</p>
                    </div>
                  )}

                  {/* Key Ideas */}
                  {explanation.keyIdeas && explanation.keyIdeas.length > 0 && (
                    <div className="dict-card">
                      <div className="dict-card-header">
                        <Layers size={14} className="text-secondary" />
                        <span className="dict-card-title">Key Ideas & Context</span>
                      </div>
                      <ul className="dict-key-ideas-list">
                        {explanation.keyIdeas.map((idea, idx) => (
                          <li key={idx} className="dict-key-idea-item">
                            <ArrowRight size={13} className="text-accent mt-0.5 shrink-0" />
                            <span>{idea}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Difficult Vocabulary Glossary */}
                  {explanation.difficultVocabulary && explanation.difficultVocabulary.length > 0 && (
                    <div className="dict-card">
                      <div className="dict-card-header">
                        <BookOpen size={14} className="text-secondary" />
                        <span className="dict-card-title">Difficult Vocabulary Identified</span>
                      </div>
                      <div className="dict-subvocab-grid">
                        {explanation.difficultVocabulary.map((item, idx) => (
                          <div key={idx} className="dict-subvocab-row">
                            <div className="flex-1">
                              <span className="dict-subvocab-word">{item.word}</span>
                              <span className="dict-subvocab-def">{item.definition}</span>
                            </div>
                            <button
                              className="nexus-icon-btn dict-add-vocab-btn"
                              onClick={() => handleSaveSubWord(item.word, item.definition)}
                              title="Add to Personal Vocabulary"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Attribution & AI Transparency Banner */}
              <div className="dict-attribution-footer">
                <div className="dict-source-badge">
                  <span className="dict-source-dot" />
                  <span>Source: {explanation.sourceAttribution}</span>
                </div>

                {explanation.isAIGenerated ? (
                  <div className="dict-disclaimer-banner">
                    <Info size={13} className="text-amber shrink-0" />
                    <span>
                      Synthesized Linguistic Explanation: Generated for reading assistance. Not a verified legal or
                      formal dictionary definition.
                    </span>
                  </div>
                ) : (
                  <div className="dict-verified-banner">
                    <Check size={13} className="text-success shrink-0" />
                    <span>Verified Lexicographical Record (Direct Citation)</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Vocabulary List Tab */
        <div className="dictionary-vocab-pane">
          <div className="vocab-search-row">
            <Search size={14} className="vocab-search-icon" />
            <input
              type="text"
              className="vocab-search-input"
              placeholder="Search saved vocabulary..."
              value={vocabSearch}
              onChange={(e) => setVocabSearch(e.target.value)}
            />
          </div>

          {filteredVocabulary.length === 0 ? (
            <NexusState
              variant="empty"
              title="Personal Vocabulary List is Empty"
              description="Look up words or phrases in the Contextual Dictionary and click 'Save Word' to build your personal learning library."
              className="my-8"
            />
          ) : (
            <div className="vocab-items-list">
              {filteredVocabulary.map((item) => (
                <div key={item.id} className="vocab-card">
                  <div className="vocab-card-header">
                    <div className="flex items-center gap-2">
                      <span className="vocab-term">{item.term}</span>
                      {item.partOfSpeech && <span className="vocab-pos">{item.partOfSpeech}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="nexus-icon-btn vocab-action-btn"
                        onClick={() => {
                          setQuery(item.term);
                          handleExplain(item.term);
                        }}
                        title="Explain again"
                      >
                        <Search size={13} />
                      </button>
                      <button
                        className="nexus-icon-btn vocab-action-btn text-danger"
                        onClick={() => handleDeleteVocab(item.id)}
                        title="Delete from vocabulary"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="vocab-definition">{item.definition}</p>
                  {item.example && <p className="vocab-example">"{item.example}"</p>}
                  <div className="vocab-date">Added {new Date(item.dateAdded).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
