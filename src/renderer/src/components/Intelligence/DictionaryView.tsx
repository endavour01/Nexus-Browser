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
import {
  Button,
  IconButton,
  Card,
  SearchInput,
  Select,
  Badge,
  Tabs,
} from '../ui';

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
          <div className="dict-icon-badge" title="Dictionary & Vocabulary">
            <BookOpen size={16} className="text-accent" />
          </div>
          <span className="dict-title">Dictionary</span>
        </div>

        {/* Tab Switcher */}
        <Tabs
          tabs={[
            { id: 'explainer', label: 'Lookup & Explainer' },
            { id: 'vocabulary', label: 'Vocabulary', badge: vocabulary.length },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as 'explainer' | 'vocabulary')}
          variant="segmented"
          size="sm"
        />
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
            <div className="flex-1">
              <SearchInput
                size="sm"
                placeholder="Enter word, phrase, sentence, or paragraph..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClear={() => {
                  setQuery('');
                  setExplanation(null);
                }}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              disabled={isLoading || !query.trim()}
            >
              Explain
            </Button>
          </form>

          {/* Reading Level & Language Controls */}
          <div className="dict-controls-row">
            <div className="flex items-center gap-2">
              <span className="dict-ctrl-label">Reading Level:</span>
              <Select
                size="sm"
                fullWidth={false}
                value={readingLevel}
                className="dict-reading-level-select"
                onChange={(e) => {
                  setReadingLevel(e.target.value as IntelligenceReadingLevel);
                  if (query.trim()) handleExplain(query);
                }}
                options={[
                  { value: 'simple', label: 'Simple' },
                  { value: 'standard', label: 'Standard' },
                  { value: 'advanced', label: 'Advanced' },
                ]}
              />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="dict-ctrl-label">Language:</span>
              <Select
                size="sm"
                fullWidth={false}
                value={targetLanguage}
                className="dict-language-select"
                onChange={(e) => {
                  setTargetLanguage(e.target.value);
                  if (query.trim()) handleExplain(query);
                }}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Español (Spanish)' },
                  { value: 'fr', label: 'Français (French)' },
                  { value: 'de', label: 'Deutsch (German)' },
                  { value: 'it', label: 'Italiano (Italian)' },
                  { value: 'pt', label: 'Português (Portuguese)' },
                  { value: 'ja', label: '日本語 (Japanese)' },
                  { value: 'zh', label: '中文 (Chinese)' },
                  { value: 'ko', label: '한국어 (Korean)' },
                  { value: 'ru', label: 'Русский (Russian)' },
                  { value: 'ar', label: 'العربية (Arabic)' },
                  { value: 'hi', label: 'हिन्दी (Hindi)' },
                  { value: 'nl', label: 'Nederlands (Dutch)' },
                  { value: 'tr', label: 'Türkçe (Turkish)' },
                  { value: 'pl', label: 'Polski (Polish)' },
                  { value: 'sv', label: 'Svenska (Swedish)' },
                ]}
              />
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
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={() => handleExplain(query)}
                >
                  Retry Lookup
                </Button>
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
              <Card padding="sm" className="dict-original-card">
                <div className="dict-card-header justify-between">
                  <Badge variant="neutral" size="sm">Original Selection ({explanation.selectionType})</Badge>
                  <div className="flex items-center gap-1">
                    <IconButton
                      size="xs"
                      variant="ghost"
                      icon={copiedId === 'orig' ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                      onClick={() => handleCopy(explanation.originalText, 'orig')}
                      aria-label="Copy text"
                      tooltip="Copy text"
                    />
                    {onSendToNotes && (
                      <IconButton
                        size="xs"
                        variant="ghost"
                        icon={<Plus size={13} />}
                        onClick={() =>
                          onSendToNotes(
                            explanation.originalText,
                            `Note: ${explanation.wordResult?.word || explanation.originalText.slice(0, 30)}`
                          )
                        }
                        aria-label="Send to NEXUS Notes"
                        tooltip="Send to NEXUS Notes"
                      />
                    )}
                  </div>
                </div>
                <div className="dict-original-text">"{explanation.originalText}"</div>
              </Card>

              {/* Single Word View */}
              {explanation.wordResult ? (
                <Card padding="md" className="dict-word-card">
                  <div className="dict-word-header">
                    <div>
                      <h3 className="dict-word-title">{explanation.wordResult.word}</h3>
                      {explanation.wordResult.phonetics && explanation.wordResult.phonetics[0]?.text && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="dict-phonetic-text">{explanation.wordResult.phonetics[0].text}</span>
                          {explanation.wordResult.phonetics[0].audio && (
                            <IconButton
                              size="xs"
                              variant="ghost"
                              icon={<Volume2 size={14} />}
                              onClick={() => handlePlayAudio(explanation.wordResult?.phonetics?.[0]?.audio)}
                              aria-label="Listen to pronunciation"
                              tooltip="Listen to pronunciation"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      variant={isCurrentTermSaved ? 'primary' : 'secondary'}
                      size="xs"
                      leftIcon={isCurrentTermSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                      onClick={handleToggleVocabulary}
                      title={isCurrentTermSaved ? 'Saved in Personal Vocabulary' : 'Save to Personal Vocabulary'}
                    >
                      {isCurrentTermSaved ? 'Saved' : 'Save Word'}
                    </Button>
                  </div>

                  {/* Meanings */}
                  <div className="dict-meanings-list">
                    {explanation.wordResult.meanings.map((meaning, mIdx) => (
                      <div key={mIdx} className="dict-meaning-block">
                        <Badge variant="neutral" size="sm" className="mb-2">
                          {meaning.partOfSpeech}
                        </Badge>
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
                              <Button
                                key={sIdx}
                                variant="secondary"
                                size="xs"
                                onClick={() => {
                                  setQuery(syn);
                                  handleExplain(syn);
                                }}
                              >
                                {syn}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              ) : (
                /* Phrase / Sentence / Paragraph View */
                <div className="dict-explanation-body">
                  {/* Simplified Meaning */}
                  {explanation.simplifiedMeaning && (
                    <Card padding="md" className="dict-highlight-card">
                      <div className="dict-card-header">
                        <Sparkles size={14} className="text-accent" />
                        <span className="dict-card-title">Plain Language Breakdown</span>
                      </div>
                      <p className="dict-simple-text">{explanation.simplifiedMeaning}</p>
                    </Card>
                  )}

                  {/* Key Ideas */}
                  {explanation.keyIdeas && explanation.keyIdeas.length > 0 && (
                    <Card padding="md">
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
                    </Card>
                  )}

                  {/* Difficult Vocabulary Glossary */}
                  {explanation.difficultVocabulary && explanation.difficultVocabulary.length > 0 && (
                    <Card padding="md">
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
                            <IconButton
                              size="xs"
                              variant="ghost"
                              icon={<Plus size={13} />}
                              onClick={() => handleSaveSubWord(item.word, item.definition)}
                              aria-label="Add to Personal Vocabulary"
                              tooltip="Add to Personal Vocabulary"
                            />
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Attribution & AI Transparency Banner */}
              <div className="dict-attribution-footer">
                <Badge variant="neutral" size="sm" dot>
                  Source: {explanation.sourceAttribution}
                </Badge>

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
          <div className="mb-3">
            <SearchInput
              size="sm"
              placeholder="Search saved vocabulary..."
              value={vocabSearch}
              onChange={(e) => setVocabSearch(e.target.value)}
              onClear={() => setVocabSearch('')}
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
                <Card key={item.id} variant="default" padding="sm" className="vocab-card">
                  <div className="vocab-card-header">
                    <div className="flex items-center gap-2">
                      <span className="vocab-term">{item.term}</span>
                      {item.partOfSpeech && (
                        <Badge variant="neutral" size="sm">
                          {item.partOfSpeech}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <IconButton
                        size="xs"
                        variant="ghost"
                        icon={<Search size={13} />}
                        onClick={() => {
                          setQuery(item.term);
                          handleExplain(item.term);
                        }}
                        aria-label="Explain again"
                        tooltip="Explain again"
                      />
                      <IconButton
                        size="xs"
                        variant="ghost"
                        icon={<Trash2 size={13} />}
                        onClick={() => handleDeleteVocab(item.id)}
                        className="text-danger"
                        aria-label="Delete from vocabulary"
                        tooltip="Delete from vocabulary"
                      />
                    </div>
                  </div>
                  <p className="vocab-definition">{item.definition}</p>
                  {item.example && <p className="vocab-example">"{item.example}"</p>}
                  <div className="vocab-date">Added {new Date(item.dateAdded).toLocaleDateString()}</div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
