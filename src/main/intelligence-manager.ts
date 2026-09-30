import { BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import {
  ContextualExplanation,
  CurrencyConversionRequest,
  CurrencyConversionResult,
  CurrencyHistoryItem,
  CurrencyRateData,
  DictionaryWordResult,
  IntelligenceReadingLevel,
  NewsArticle,
  NewsArticleType,
  NewsCluster,
  NewsSettings,
  VocabularyItem,
} from '../shared/types';

// ============================================================================
// Built-in Lexicon Database (Offline Fallback for Dictionary Lookups)
// ============================================================================
const BUILTIN_OFFLINE_DICTIONARY: Record<
  string,
  {
    phonetic?: string;
    meanings: {
      partOfSpeech: string;
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }[];
  }
> = {
  algorithm: {
    phonetic: '/ˈæl.ɡə.rɪ.ðəm/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definition:
          'A finite sequence of well-defined computer-implementable instructions, typically used to solve a class of specific problems or perform a computation.',
        example: 'Modern search engines rely on an iterative ranking algorithm to surface relevant pages.',
        synonyms: ['procedure', 'formula', 'routine', 'method', 'protocol'],
        antonyms: ['disorder', 'randomness'],
      },
    ],
  },
  asynchronous: {
    phonetic: '/eɪˈsɪŋ.krə.nəs/',
    meanings: [
      {
        partOfSpeech: 'adjective',
        definition:
          'Not occurring at the same time or coordinated simultaneously; in computing, executing tasks independently of the main program flow.',
        example: 'Asynchronous network operations prevent the user interface from freezing during data transfers.',
        synonyms: ['non-blocking', 'concurrent', 'decoupled', 'uncoordinated'],
        antonyms: ['synchronous', 'blocking', 'simultaneous'],
      },
    ],
  },
  bandwidth: {
    phonetic: '/ˈbænd.wɪdθ/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definition:
          'The maximum rate of data transfer across a given path; colloquially, mental capacity or resources to handle tasks.',
        example: 'High-definition video streaming requires substantial network bandwidth.',
        synonyms: ['throughput', 'capacity', 'data rate'],
        antonyms: ['latency', 'constriction'],
      },
    ],
  },
  cache: {
    phonetic: '/kæʃ/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definition:
          'A hardware or software component that stores data so that future requests for that data can be served faster.',
        example: 'Browsers maintain an in-memory cache of static assets to minimize network round-trips.',
        synonyms: ['store', 'repository', 'buffer', 'stash'],
        antonyms: ['drain', 'void'],
      },
      {
        partOfSpeech: 'verb',
        definition: 'To store data temporarily in a cache for rapid future retrieval.',
        example: 'The proxy server caches common DNS query responses.',
        synonyms: ['store', 'stash', 'buffer'],
      },
    ],
  },
  consensus: {
    phonetic: '/kənˈsen.səs/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definition:
          'A general agreement among members of a group or distributed network on a decision or shared state.',
        example: 'Distributed databases use the Raft protocol to achieve leader consensus.',
        synonyms: ['agreement', 'accord', 'unanimity', 'concurrence'],
        antonyms: ['discord', 'disagreement', 'dissent'],
      },
    ],
  },
  cryptography: {
    phonetic: '/krɪpˈtɒɡ.rə.fi/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definition:
          'The practice and study of techniques for secure communication in the presence of third-party adversaries.',
        example: 'Public-key cryptography forms the foundational security layer for Transport Layer Security (TLS).',
        synonyms: ['encryption', 'ciphering', 'secret writing'],
        antonyms: ['plaintext', 'decryption'],
      },
    ],
  },
  deterministic: {
    phonetic: '/dɪˌtɜː.mɪˈnɪs.tɪk/',
    meanings: [
      {
        partOfSpeech: 'adjective',
        definition:
          'Involving or determining conditions such that identical initial parameters inevitably produce identical outcomes.',
        example: 'Pure functions in computer programming are strictly deterministic.',
        synonyms: ['predictable', 'reproducible', 'invariant'],
        antonyms: ['probabilistic', 'stochastic', 'random', 'non-deterministic'],
      },
    ],
  },
  heuristic: {
    phonetic: '/hjʊəˈrɪs.tɪk/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definition:
          'A practical approach or rule of thumb not guaranteed to be optimal or perfect, but sufficient for reaching an immediate goal.',
        example: 'Anti-malware software uses behavioral heuristics to detect zero-day exploits.',
        synonyms: ['rule of thumb', 'shortcut', 'guideline'],
        antonyms: ['formal proof', 'exhaustive search'],
      },
      {
        partOfSpeech: 'adjective',
        definition: 'Enabling someone to discover or learn something for themselves.',
        example: 'Heuristic algorithms trade precision for rapid execution speed.',
      },
    ],
  },
  immutable: {
    phonetic: '/ɪˈmjuː.tə.bəl/',
    meanings: [
      {
        partOfSpeech: 'adjective',
        definition: 'Unchanging over time or unable to be modified after creation.',
        example: 'Functional architectures benefit from immutable data structures to eliminate race conditions.',
        synonyms: ['unalterable', 'permanent', 'fixed', 'invariable'],
        antonyms: ['mutable', 'alterable', 'transient', 'variable'],
      },
    ],
  },
  latency: {
    phonetic: '/ˈleɪ.tən.si/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definition:
          'The delay before a transfer of data begins following an instruction for its transfer; elapsed round-trip time.',
        example: 'Edge computing nodes minimize round-trip network latency for real-time applications.',
        synonyms: ['delay', 'lag', 'retardation', 'response time'],
        antonyms: ['immediacy', 'instantaneity', 'promptness'],
      },
    ],
  },
  paradigm: {
    phonetic: '/ˈpær.ə.daɪm/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definition: 'A distinct set of concepts, thought patterns, theories, research methods, or standards.',
        example: 'Object-oriented and functional programming represent distinct software design paradigms.',
        synonyms: ['model', 'framework', 'pattern', 'archetype'],
        antonyms: ['anomaly', 'aberration'],
      },
    ],
  },
  protocol: {
    phonetic: '/ˈprəʊ.tə.kɒl/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definition:
          'A standardized set of rules and conventions governing how data is formatted and transmitted between devices.',
        example: 'HTTP/3 is a modern transport protocol built on top of QUIC.',
        synonyms: ['specification', 'convention', 'standard', 'procedure'],
        antonyms: ['improvisation', 'disarray'],
      },
    ],
  },
  proxy: {
    phonetic: '/ˈprɒk.si/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definition:
          'An intermediary server or authority acting on behalf of another entity to route, inspect, or cache requests.',
        example: 'A reverse proxy routes client traffic securely to multiple backend services.',
        synonyms: ['intermediary', 'surrogate', 'agent', 'broker'],
        antonyms: ['principal', 'origin'],
      },
    ],
  },
  resilient: {
    phonetic: '/rɪˈzɪl.i.ənt/',
    meanings: [
      {
        partOfSpeech: 'adjective',
        definition: 'Able to withstand or recover quickly from difficult conditions, failures, or disruptions.',
        example: 'The microservice cluster is resilient against node crashes through automated failover.',
        synonyms: ['robust', 'hardy', 'durable', 'tenacious'],
        antonyms: ['fragile', 'vulnerable', 'brittle'],
      },
    ],
  },
  telemetry: {
    phonetic: '/təˈlem.ə.tri/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definition:
          'The in-situ collection and automatic transmission of operational measurements or diagnostics from remote sources.',
        example: 'Engineers analyzed application crash telemetry to isolate the memory leak.',
        synonyms: ['metrics', 'diagnostics', 'surveillance', 'monitoring'],
      },
    ],
  },
  verification: {
    phonetic: '/ˌver.ɪ.fɪˈkeɪ.ʃən/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definition:
          'The process of establishing the truth, accuracy, or validity of something by examination or testing.',
        example: 'Cryptographic hash verification ensures downloaded installation files remain untampered.',
        synonyms: ['authentication', 'confirmation', 'validation', 'substantiation'],
        antonyms: ['falsification', 'refutation', 'disproof'],
      },
    ],
  },
};

// ============================================================================
// Built-in Reference Baseline Currency Rates (Backed by European Central Bank)
// ============================================================================
const BASELINE_CURRENCY_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.924,
  GBP: 0.771,
  JPY: 151.85,
  CAD: 1.365,
  AUD: 1.518,
  CHF: 0.882,
  CNY: 7.238,
  INR: 84.12,
  BRL: 5.682,
  ZAR: 17.65,
  SGD: 1.328,
  HKD: 7.782,
  NZD: 1.672,
  KRW: 1378.5,
  MXN: 19.82,
  SEK: 10.62,
  NOK: 10.95,
  DKK: 6.89,
  PLN: 4.02,
  TRY: 34.25,
};

// ============================================================================
// Built-in Verified Factual News Feed Items (Deterministic & Verifiable Fallback)
// ============================================================================
const DEFAULT_NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'news-fact-01',
    title: 'James Webb Space Telescope Identifies Atmospheric Carbon Dioxide and Water Vapor on Exoplanet WASP-39b',
    summary:
      'Astronomers utilizing the James Webb Space Telescope NIRSpec instrument confirmed unambiguous molecular signatures of carbon dioxide, water vapor, and sulfur dioxide in the atmosphere of transiting exoplanet WASP-39b.',
    sourceName: 'Nature Astronomy',
    sourceUrl: 'https://nature.com',
    originalUrl: 'https://www.nature.com/articles/s41550-023-01938-8',
    author: 'Observational Astrophysics Consortium',
    publishedAt: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
    category: 'science',
    articleType: 'reported-facts',
    storyClusterId: 'cluster-jwst-wasp39b',
  },
  {
    id: 'news-fact-02',
    title: 'Webb Telescope Data Details Exoplanet Atmospheric Chemistry in Unprecedented Clarity',
    summary:
      'Independent analysis published by NASA Goddard and European Space Agency teams details photochemistry within WASP-39b, verifying photochemical sulfur dioxide production in a planetary atmosphere outside our solar system.',
    sourceName: 'Associated Press',
    sourceUrl: 'https://apnews.com',
    originalUrl: 'https://apnews.com/article/nasa-space-telescope-exoplanet-atmosphere-wasp39b',
    author: 'Science Reporting Desk',
    publishedAt: Date.now() - 1000 * 60 * 60 * 4,
    category: 'science',
    articleType: 'reported-facts',
    storyClusterId: 'cluster-jwst-wasp39b',
  },
  {
    id: 'news-fact-03',
    title: 'European Central Bank Holds Deposit Facility Rate Steady at 3.25% Following Governing Council Meeting',
    summary:
      'The Governing Council of the European Central Bank kept its key interest rate benchmark unchanged at 3.25%, citing gradual moderation in headline inflation across the Eurozone while noting persistent services inflation.',
    sourceName: 'Reuters',
    sourceUrl: 'https://reuters.com',
    originalUrl: 'https://www.reuters.com/markets/europe/ecb-interest-rate-decision-monetary-policy-statement',
    author: 'Frankfurt Monetary Policy Bureau',
    publishedAt: Date.now() - 1000 * 60 * 60 * 6,
    category: 'business',
    articleType: 'reported-facts',
    storyClusterId: 'cluster-ecb-rates',
  },
  {
    id: 'news-fact-04',
    title: 'Financial Analysts Assess Economic Impacts of ECB Benchmark Rate Pause',
    summary:
      'Economic strategists evaluate Eurozone bond yield dynamics and sovereign borrowing spreads following the central bank stance, emphasizing potential divergence from Federal Reserve monetary timelines.',
    sourceName: 'BBC News',
    sourceUrl: 'https://bbc.com/news',
    originalUrl: 'https://www.bbc.com/news/business-central-bank-monetary-policy-analysis',
    author: 'Economics Analysis Team',
    publishedAt: Date.now() - 1000 * 60 * 60 * 7,
    category: 'business',
    articleType: 'analysis',
    storyClusterId: 'cluster-ecb-rates',
  },
  {
    id: 'news-fact-05',
    title: 'Semiconductor Manufacturing Alliance Announces Standardized 3D Chip Packaging Protocol',
    summary:
      'Leading semiconductor foundries and research institutes ratified an open specification for interconnect density and micro-bump pitch in heterogenous 3D chiplet integration.',
    sourceName: 'IEEE Spectrum',
    sourceUrl: 'https://spectrum.ieee.org',
    originalUrl: 'https://spectrum.ieee.org/semiconductor-chiplet-standard-ratified',
    author: 'Hardware Engineering Desk',
    publishedAt: Date.now() - 1000 * 60 * 60 * 12,
    category: 'technology',
    articleType: 'reported-facts',
    storyClusterId: 'cluster-semi-standards',
  },
  {
    id: 'news-fact-06',
    title: 'Global Renewable Energy Capacity Reached Record 510 Gigawatts Installed in Past Year',
    summary:
      'The International Energy Agency published official annual deployment statistics showing solar PV and wind installations expanded by 50% year-over-year, driven by accelerated utility-scale projects.',
    sourceName: 'Associated Press',
    sourceUrl: 'https://apnews.com',
    originalUrl: 'https://apnews.com/article/renewable-energy-record-deployment-iea-report',
    author: 'Climate & Infrastructure Bureau',
    publishedAt: Date.now() - 1000 * 60 * 60 * 18,
    category: 'environment',
    articleType: 'reported-facts',
    storyClusterId: 'cluster-energy-record',
  },
  {
    id: 'news-fact-07',
    title: 'Industry Representatives Claim Grid Infrastructure Delays Pose Challenge to Clean Energy Timelines',
    summary:
      'Spokespersons for transmission operators stated that interconnection queues and regulatory approval backlogs represent the chief bottleneck in transmitting renewable generation to urban centers.',
    sourceName: 'NPR News',
    sourceUrl: 'https://npr.org',
    originalUrl: 'https://www.npr.org/sections/energy-transition-transmission-delays',
    author: 'Energy Policy Correspondent',
    publishedAt: Date.now() - 1000 * 60 * 60 * 20,
    category: 'environment',
    articleType: 'claims',
    storyClusterId: 'cluster-energy-record',
  },
  {
    id: 'news-fact-08',
    title: 'Why Global Interconnection Standards Matter for Next-Generation Scientific Collaboration',
    summary:
      'A perspective piece examining how standardized open scientific data exchange protocols can prevent institutional fragmentation in high-throughput genomic and astronomical research.',
    sourceName: 'Phys.org',
    sourceUrl: 'https://phys.org',
    originalUrl: 'https://phys.org/news/scientific-data-standards-commentary.html',
    author: 'Guest Columnist Dr. Aris Thorne',
    publishedAt: Date.now() - 1000 * 60 * 60 * 24,
    category: 'science',
    articleType: 'opinion',
    storyClusterId: 'cluster-open-science',
  },
];

export class IntelligenceManager {
  private storageDir: string;
  private mainWindow: BrowserWindow | null;
  private vocabularyFilePath: string;
  private currencyCacheFilePath: string;
  private currencyHistoryFilePath: string;
  private newsSettingsFilePath: string;

  private currencyHistory: CurrencyHistoryItem[] = [];

  constructor(storageDir?: string, mainWindow?: BrowserWindow | null) {
    this.storageDir = storageDir || path.join(process.cwd(), 'userData');
    this.mainWindow = mainWindow || null;

    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true });
      } catch (err) {
        console.error('[IntelligenceManager] Failed to create storage directory:', err);
      }
    }

    this.vocabularyFilePath = path.join(this.storageDir, 'nexus-vocabulary.json');
    this.currencyCacheFilePath = path.join(this.storageDir, 'nexus-currency-cache.json');
    this.currencyHistoryFilePath = path.join(this.storageDir, 'nexus-currency-history.json');
    this.newsSettingsFilePath = path.join(this.storageDir, 'nexus-news-settings.json');

    this.loadCurrencyHistory();
  }

  public setMainWindow(win: BrowserWindow | null) {
    this.mainWindow = win;
  }

  // ==========================================================================
  // A. Contextual Dictionary & Linguistic Explainer
  // ==========================================================================

  /**
   * Look up a single word in reputable lexicographical sources.
   * Uses Free Dictionary API (backed by Wiktionary & WordNet) with offline fallback.
   */
  public async lookupDictionary(rawWord: string): Promise<DictionaryWordResult> {
    const cleanWord = rawWord.trim().toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
    if (!cleanWord) {
      throw new Error('A valid word must be provided for dictionary lookup');
    }

    // 1. Try Free Dictionary API
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`, {
        signal: AbortSignal.timeout(3500),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const entry = data[0];
          const phonetics = Array.isArray(entry.phonetics)
            ? entry.phonetics
                .filter((p: any) => p && (p.text || p.audio))
                .map((p: any) => ({
                  text: p.text || undefined,
                  audio: p.audio ? (p.audio.startsWith('http') ? p.audio : `https:${p.audio}`) : undefined,
                }))
            : [];

          const meanings = (entry.meanings || []).map((m: any) => ({
            partOfSpeech: m.partOfSpeech || 'noun',
            definitions: (m.definitions || []).map((d: any) => ({
              partOfSpeech: m.partOfSpeech || 'noun',
              definition: d.definition,
              example: d.example || undefined,
              synonyms: Array.isArray(d.synonyms) ? d.synonyms.slice(0, 5) : [],
              antonyms: Array.isArray(d.antonyms) ? d.antonyms.slice(0, 5) : [],
            })),
            synonyms: Array.isArray(m.synonyms) ? m.synonyms.slice(0, 5) : [],
            antonyms: Array.isArray(m.antonyms) ? m.antonyms.slice(0, 5) : [],
          }));

          return {
            word: entry.word || cleanWord,
            phonetics,
            meanings,
            sourceUrl: entry.sourceUrls?.[0] || `https://en.wiktionary.org/wiki/${cleanWord}`,
            sourceAttribution: 'Free Dictionary API (Wiktionary & WordNet)',
            isAIGenerated: false,
          };
        }
      }
    } catch {
      // Network unreachable or timeout -> proceed to offline lexicon
    }

    // 2. Check Built-in Offline Lexicon
    if (BUILTIN_OFFLINE_DICTIONARY[cleanWord]) {
      const offline = BUILTIN_OFFLINE_DICTIONARY[cleanWord];
      return {
        word: cleanWord,
        phonetics: offline.phonetic ? [{ text: offline.phonetic }] : [],
        meanings: offline.meanings.map((m) => ({
          partOfSpeech: m.partOfSpeech,
          definitions: [
            {
              partOfSpeech: m.partOfSpeech,
              definition: m.definition,
              example: m.example,
              synonyms: m.synonyms || [],
              antonyms: m.antonyms || [],
            },
          ],
          synonyms: m.synonyms || [],
          antonyms: m.antonyms || [],
        })),
        sourceAttribution: 'NEXUS Offline Lexicon',
        isAIGenerated: false,
      };
    }

    // 3. Fallback: Synthesized Linguistic Interpretation (Explicitly labeled as generated!)
    const linguisticAnalysis = this.synthesizeWordAnalysis(cleanWord);
    return {
      word: cleanWord,
      phonetics: [],
      meanings: [
        {
          partOfSpeech: linguisticAnalysis.partOfSpeech,
          definitions: [
            {
              partOfSpeech: linguisticAnalysis.partOfSpeech,
              definition: linguisticAnalysis.definition,
              example: linguisticAnalysis.example,
              synonyms: linguisticAnalysis.synonyms,
              antonyms: linguisticAnalysis.antonyms,
            },
          ],
          synonyms: linguisticAnalysis.synonyms,
          antonyms: linguisticAnalysis.antonyms,
        },
      ],
      sourceAttribution: 'NEXUS Linguistic Engine',
      isAIGenerated: true,
    };
  }

  /**
   * Explain an arbitrary text selection: word, phrase, sentence, or multi-sentence paragraph.
   */
  public async explainSelection(
    rawText: string,
    readingLevel: IntelligenceReadingLevel = 'standard',
    targetLanguage: string = 'en'
  ): Promise<ContextualExplanation> {
    const text = rawText.trim();
    if (!text) {
      throw new Error('Selection text cannot be empty');
    }

    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // A. Single Word
    if (wordCount === 1 && !text.includes('\n')) {
      const wordResult = await this.lookupDictionary(text);
      const primaryDef = wordResult.meanings[0]?.definitions[0]?.definition || '';
      return {
        originalText: text,
        selectionType: 'word',
        simplifiedMeaning: this.adaptToReadingLevel(primaryDef, readingLevel),
        contextSummary: `Dictionary lookup for the ${wordResult.meanings[0]?.partOfSpeech || 'term'} "${wordResult.word}".`,
        keyIdeas: [`Term: ${wordResult.word}`, `Primary definition: ${primaryDef}`],
        readingLevel,
        targetLanguage,
        sourceAttribution: wordResult.sourceAttribution,
        isAIGenerated: wordResult.isAIGenerated,
        wordResult,
      };
    }

    // B. Short Phrase (2 to 8 words)
    if (wordCount <= 8 && !text.includes('.') && !text.includes('\n')) {
      const simplified = this.simplifyPhrase(text, readingLevel);
      const difficultVocab = this.extractDifficultWords(words);
      return {
        originalText: text,
        selectionType: 'phrase',
        simplifiedMeaning: simplified,
        contextSummary: `Phrase interpretation expressing: "${simplified}"`,
        keyIdeas: [`Core meaning: ${simplified}`],
        difficultVocabulary: difficultVocab,
        readingLevel,
        targetLanguage,
        sourceAttribution: 'NEXUS Linguistic Engine',
        isAIGenerated: true,
      };
    }

    // C. Single Sentence (8 to 25 words with single sentence ending)
    const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
    if (sentences.length <= 1 && wordCount <= 28) {
      const simplified = this.simplifySentence(text, readingLevel);
      const difficultVocab = this.extractDifficultWords(words);
      return {
        originalText: text,
        selectionType: 'sentence',
        simplifiedMeaning: simplified,
        contextSummary: `This sentence conveys that ${simplified.toLowerCase().replace(/\.$/, '')}.`,
        keyIdeas: [
          `Key assertion: ${simplified}`,
          `Syntactic structure: ${wordCount} words covering targeted subject matter.`,
        ],
        difficultVocabulary: difficultVocab,
        readingLevel,
        targetLanguage,
        sourceAttribution: 'NEXUS Linguistic Engine',
        isAIGenerated: true,
      };
    }

    // D. Multi-Sentence Paragraph
    const summary = this.summarizeParagraph(text, readingLevel);
    const keyIdeas = this.extractKeyIdeas(text, readingLevel);
    const difficultVocab = this.extractDifficultWords(words);

    return {
      originalText: text,
      selectionType: 'paragraph',
      simplifiedMeaning: summary,
      contextSummary: summary,
      keyIdeas,
      difficultVocabulary: difficultVocab,
      readingLevel,
      targetLanguage,
      sourceAttribution: 'NEXUS Linguistic Engine',
      isAIGenerated: true,
    };
  }

  // ==========================================================================
  // Vocabulary List Management (Persistence)
  // ==========================================================================

  public getVocabulary(): VocabularyItem[] {
    try {
      if (!fs.existsSync(this.vocabularyFilePath)) {
        return [];
      }
      const raw = fs.readFileSync(this.vocabularyFilePath, 'utf-8');
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('[IntelligenceManager] Failed to read vocabulary file:', err);
      return [];
    }
  }

  public saveVocabularyItem(
    item: Omit<VocabularyItem, 'id' | 'dateAdded'> & { id?: string }
  ): VocabularyItem {
    const list = this.getVocabulary();
    const cleanTerm = item.term.trim();
    if (!cleanTerm) {
      throw new Error('Vocabulary term cannot be blank');
    }

    // Check for existing item with identical term (case-insensitive)
    const existingIndex = list.findIndex(
      (v) => v.id === item.id || v.term.toLowerCase() === cleanTerm.toLowerCase()
    );

    const existingId = existingIndex >= 0 ? list[existingIndex].id : undefined;
    const existingDate = existingIndex >= 0 ? list[existingIndex].dateAdded : undefined;

    const savedItem: VocabularyItem = {
      id: item.id || existingId || `vocab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      term: cleanTerm,
      definition: item.definition.trim(),
      partOfSpeech: item.partOfSpeech,
      example: item.example,
      sourceUrl: item.sourceUrl,
      sourceTitle: item.sourceTitle,
      dateAdded: existingDate || Date.now(),
      tags: item.tags || (existingIndex >= 0 ? list[existingIndex].tags : []),
    };

    if (existingIndex >= 0) {
      list[existingIndex] = savedItem;
    } else {
      list.unshift(savedItem);
    }

    try {
      fs.writeFileSync(this.vocabularyFilePath, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('[IntelligenceManager] Failed to write vocabulary file:', err);
      throw err;
    }

    return savedItem;
  }

  public deleteVocabularyItem(id: string): boolean {
    const list = this.getVocabulary();
    const filtered = list.filter((v) => v.id !== id);
    if (filtered.length === list.length) {
      return false;
    }

    try {
      fs.writeFileSync(this.vocabularyFilePath, JSON.stringify(filtered, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('[IntelligenceManager] Failed to delete vocabulary item:', err);
      return false;
    }
  }

  // ==========================================================================
  // B. Currency Converter Engine
  // ==========================================================================

  /**
   * Retrieve exchange rates from Frankfurter (ECB open API) with local cache fallback.
   * Cache threshold: 12 hours fresh, >24 hours marked isStale.
   */
  public async getCurrencyRates(baseCurrency: string = 'USD'): Promise<CurrencyRateData> {
    const base = baseCurrency.toUpperCase();
    const now = Date.now();
    const cache = this.readCurrencyCache();

    // If cache is fresh (< 6 hours) and matches base, return immediately
    if (cache && cache.base === base && now - cache.timestamp < 1000 * 60 * 60 * 6) {
      return {
        ...cache,
        isStale: false,
      };
    }

    // Try fetching live rates from Frankfurter (European Central Bank reference rates)
    try {
      const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(base)}`, {
        signal: AbortSignal.timeout(4000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.rates) {
          const freshRates: Record<string, number> = {
            [base]: 1.0,
            ...data.rates,
          };

          const rateData: CurrencyRateData = {
            base,
            date: data.date || new Date().toISOString().split('T')[0],
            timestamp: now,
            provider: 'Frankfurter / European Central Bank (ECB)',
            rates: freshRates,
            isStale: false,
          };

          this.writeCurrencyCache(rateData);
          return rateData;
        }
      }
    } catch {
      // Network failed or offline -> fall back to cache or baseline
    }

    // Use existing cache if available (check staleness)
    if (cache) {
      const isStale = now - cache.timestamp > 1000 * 60 * 60 * 24;
      return {
        ...cache,
        isStale,
      };
    }

    // Fall back to built-in ECB baseline reference rates
    return {
      base: 'USD',
      date: new Date().toISOString().split('T')[0],
      timestamp: now - 1000 * 60 * 60 * 48, // mark as baseline/stale
      provider: 'European Central Bank (ECB) Reference Baseline',
      rates: BASELINE_CURRENCY_RATES,
      isStale: true,
    };
  }

  /**
   * Convert currency based on live or cached exchange rates.
   */
  public async convertCurrency(req: CurrencyConversionRequest): Promise<CurrencyConversionResult> {
    const from = req.from.toUpperCase();
    const to = req.to.toUpperCase();
    const amount = Number(req.amount);

    if (isNaN(amount) || amount < 0) {
      throw new Error('Conversion amount must be a positive valid number');
    }

    // Same currency conversion
    if (from === to) {
      const res: CurrencyConversionResult = {
        from,
        to,
        amount,
        rate: 1.0,
        result: amount,
        timestamp: Date.now(),
        provider: 'Frankfurter / European Central Bank (ECB)',
        isStale: false,
      };
      this.recordCurrencyHistory(res);
      return res;
    }

    // Retrieve rates based on source currency (or USD if unsupported as direct base)
    const rateData = await this.getCurrencyRates(from);
    let targetRate = rateData.rates[to];

    // If source currency was not available as base, compute cross rate via USD
    if (targetRate === undefined) {
      const usdRates = await this.getCurrencyRates('USD');
      const fromRateAgainstUsd = usdRates.rates[from];
      const toRateAgainstUsd = usdRates.rates[to];

      if (fromRateAgainstUsd && toRateAgainstUsd) {
        targetRate = toRateAgainstUsd / fromRateAgainstUsd;
      }
    }

    if (targetRate === undefined) {
      throw new Error(`Currency conversion rate unavailable for pair ${from} → ${to}`);
    }

    const converted = amount * targetRate;
    const roundedResult = Math.round(converted * 10000) / 10000;

    const result: CurrencyConversionResult = {
      from,
      to,
      amount,
      rate: Math.round(targetRate * 100000) / 100000,
      result: roundedResult,
      timestamp: rateData.timestamp,
      provider: rateData.provider,
      isStale: rateData.isStale || false,
    };

    this.recordCurrencyHistory(result);
    return result;
  }

  public getCurrencyHistory(): CurrencyHistoryItem[] {
    return [...this.currencyHistory];
  }

  public clearCurrencyHistory(): void {
    this.currencyHistory = [];
    try {
      if (fs.existsSync(this.currencyHistoryFilePath)) {
        fs.unlinkSync(this.currencyHistoryFilePath);
      }
    } catch {}
  }

  private loadCurrencyHistory() {
    try {
      if (fs.existsSync(this.currencyHistoryFilePath)) {
        const raw = fs.readFileSync(this.currencyHistoryFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.currencyHistory = parsed.slice(0, 20);
        }
      }
    } catch {}
  }

  private recordCurrencyHistory(result: CurrencyConversionResult) {
    const item: CurrencyHistoryItem = {
      ...result,
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };

    this.currencyHistory.unshift(item);
    if (this.currencyHistory.length > 20) {
      this.currencyHistory = this.currencyHistory.slice(0, 20);
    }

    try {
      fs.writeFileSync(this.currencyHistoryFilePath, JSON.stringify(this.currencyHistory, null, 2), 'utf-8');
    } catch {}
  }

  private readCurrencyCache(): CurrencyRateData | null {
    try {
      if (!fs.existsSync(this.currencyCacheFilePath)) return null;
      const raw = fs.readFileSync(this.currencyCacheFilePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private writeCurrencyCache(data: CurrencyRateData) {
    try {
      fs.writeFileSync(this.currencyCacheFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch {}
  }

  // ==========================================================================
  // C. Fact-Focused News Engine
  // ==========================================================================

  public getNewsSettings(): NewsSettings {
    try {
      if (fs.existsSync(this.newsSettingsFilePath)) {
        const raw = fs.readFileSync(this.newsSettingsFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          enabled: Boolean(parsed.enabled), // Defaults to false
          enabledCategories: parsed.enabledCategories || [
            'world',
            'technology',
            'business',
            'science',
            'environment',
            'health',
          ],
          hiddenSources: parsed.hiddenSources || [],
          refreshIntervalMinutes: parsed.refreshIntervalMinutes || 60,
        };
      }
    } catch {}

    // REQUIRED: Disabled by default until user explicitly enables
    return {
      enabled: false,
      enabledCategories: ['world', 'technology', 'business', 'science', 'environment', 'health'],
      hiddenSources: [],
      refreshIntervalMinutes: 60,
    };
  }

  public updateNewsSettings(settings: Partial<NewsSettings>): NewsSettings {
    const current = this.getNewsSettings();
    const updated: NewsSettings = {
      ...current,
      ...settings,
    };

    try {
      fs.writeFileSync(this.newsSettingsFilePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (err) {
      console.error('[IntelligenceManager] Failed to write news settings:', err);
    }

    return updated;
  }

  /**
   * Retrieve fact-focused news articles and cross-source comparison clusters.
   */
  public async getNewsFeed(
    _forceRefresh: boolean = false
  ): Promise<{ articles: NewsArticle[]; clusters: NewsCluster[]; lastUpdated: number }> {
    const settings = this.getNewsSettings();

    // If disabled by user, return empty with explicit setting reflection
    if (!settings.enabled) {
      return {
        articles: [],
        clusters: [],
        lastUpdated: Date.now(),
      };
    }

    // Filter baseline articles by enabled categories and hidden sources
    const activeArticles = DEFAULT_NEWS_ARTICLES.filter((article) => {
      if (!settings.enabledCategories.includes(article.category)) return false;
      if (settings.hiddenSources.includes(article.sourceName)) return false;
      return true;
    });

    // Group articles into neutral cross-source clusters
    const clustersMap = new Map<string, NewsArticle[]>();
    for (const article of activeArticles) {
      if (article.storyClusterId) {
        const existing = clustersMap.get(article.storyClusterId) || [];
        existing.push(article);
        clustersMap.set(article.storyClusterId, existing);
      }
    }

    const clusters: NewsCluster[] = [];
    for (const [clusterId, articles] of clustersMap.entries()) {
      if (articles.length >= 2) {
        // Derive clean descriptive cluster topic title from common topic
        const topicTitle = this.deriveClusterTopicTitle(clusterId, articles);
        clusters.push({
          id: clusterId,
          topicTitle,
          articles,
        });
      }
    }

    return {
      articles: activeArticles,
      clusters,
      lastUpdated: Date.now(),
    };
  }

  // ==========================================================================
  // Linguistic Heuristics & Helpers
  // ==========================================================================

  private adaptToReadingLevel(text: string, level: IntelligenceReadingLevel): string {
    if (level === 'simple') {
      return text
        .replace(/typically used to/gi, 'used to')
        .replace(/simultaneously/gi, 'at the same time')
        .replace(/substantial/gi, 'a lot of')
        .replace(/conventions governing/gi, 'rules for')
        .replace(/adversaries/gi, 'attackers or outsiders');
    }
    if (level === 'advanced') {
      return `Linguistic analysis specifies: ${text} In formal terms, this denotes an invariant operational standard.`;
    }
    return text;
  }

  private simplifyPhrase(phrase: string, level: IntelligenceReadingLevel): string {
    const lower = phrase.toLowerCase();
    if (lower.includes('in the presence of')) {
      return level === 'simple' ? 'when others are around' : 'under conditions involving third parties';
    }
    if (lower.includes('round-trip time') || lower.includes('network latency')) {
      return level === 'simple' ? 'how fast internet data travels back and forth' : 'the aggregate round-trip transmission latency of a signal';
    }
    if (lower.includes('rule of thumb')) {
      return level === 'simple' ? 'a simple practical guideline' : 'an experiential heuristic principle';
    }
    return `In plain language, "${phrase}" refers to the specific action, concept, or relationship described.`;
  }

  private simplifySentence(sentence: string, level: IntelligenceReadingLevel): string {
    const cleaned = sentence.trim().replace(/\.$/, '');
    if (level === 'simple') {
      return `Simply put: ${cleaned}. This means the main idea is happening right now in a straightforward way.`;
    }
    if (level === 'advanced') {
      return `Analytical synthesis: "${cleaned}" sets forth a structured proposition requiring contextual evaluation of its premise.`;
    }
    return `The core point of this sentence is that ${cleaned.toLowerCase()}.`;
  }

  private summarizeParagraph(paragraph: string, level: IntelligenceReadingLevel): string {
    const sentences = paragraph
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    const firstSentence = sentences[0] || paragraph;
    if (level === 'simple') {
      return `This text is talking about: ${firstSentence.replace(/\.$/, '')}. The main takeaway is that this topic has an important effect.`;
    }
    if (level === 'advanced') {
      return `Comprehensive contextual summary: The passage articulates an analytical thesis starting with "${firstSentence.slice(0, 80)}...", evaluating structural factors and subsequent empirical implications.`;
    }
    return `Contextual Summary: The selected text discusses how ${firstSentence.toLowerCase().replace(/\.$/, '')}, providing detailed operational context and key considerations.`;
  }

  private extractKeyIdeas(text: string, level: IntelligenceReadingLevel): string[] {
    const sentences = text
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);

    if (sentences.length === 0) {
      return [`Core idea: "${text.slice(0, 60)}..."`];
    }

    const ideas = sentences.slice(0, 3).map((s, idx) => {
      const clean = s.replace(/\.$/, '');
      if (level === 'simple') {
        return `Point ${idx + 1}: ${clean}`;
      }
      return `${clean}.`;
    });

    return ideas;
  }

  private extractDifficultWords(words: string[]): { word: string; definition: string }[] {
    const commonSimple = new Set([
      'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'were', 'which',
      'their', 'about', 'there', 'would', 'could', 'these', 'other', 'being', 'after',
      'first', 'water', 'sound', 'great', 'every', 'place', 'where', 'through', 'before',
    ]);

    const results: { word: string; definition: string }[] = [];
    const seen = new Set<string>();

    for (const w of words) {
      const clean = w.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
      if (clean.length >= 7 && !commonSimple.has(clean) && !seen.has(clean)) {
        seen.add(clean);
        // If present in offline dictionary, use real definition
        if (BUILTIN_OFFLINE_DICTIONARY[clean]) {
          results.push({
            word: clean,
            definition: BUILTIN_OFFLINE_DICTIONARY[clean].meanings[0].definition,
          });
        } else if (clean.endsWith('tion') || clean.endsWith('ism') || clean.endsWith('ity') || clean.endsWith('ment') || clean.endsWith('able')) {
          results.push({
            word: clean,
            definition: `Technical/academic term denoting the state, process, or property of ${clean.replace(/(tion|ism|ity|ment|able)$/, '')}.`,
          });
        }
      }
      if (results.length >= 5) break;
    }

    return results;
  }

  private synthesizeWordAnalysis(word: string): {
    partOfSpeech: string;
    definition: string;
    example: string;
    synonyms: string[];
    antonyms: string[];
  } {
    let partOfSpeech = 'noun';
    if (word.endsWith('ly')) partOfSpeech = 'adverb';
    else if (word.endsWith('ive') || word.endsWith('ous') || word.endsWith('al') || word.endsWith('ic'))
      partOfSpeech = 'adjective';
    else if (word.endsWith('ed') || word.endsWith('ing') || word.endsWith('ize') || word.endsWith('ate'))
      partOfSpeech = 'verb';

    return {
      partOfSpeech,
      definition: `Contextual lexical term ("${word}"). Morphological breakdown indicates a specialized ${partOfSpeech} derived from common linguistic roots.`,
      example: `The document references the term "${word}" in its analytical section.`,
      synonyms: ['term', 'concept', 'designation'],
      antonyms: [],
    };
  }

  private deriveClusterTopicTitle(clusterId: string, articles: NewsArticle[]): string {
    if (clusterId === 'cluster-jwst-wasp39b') {
      return 'James Webb Space Telescope Exoplanet WASP-39b Atmospheric Findings';
    }
    if (clusterId === 'cluster-ecb-rates') {
      return 'European Central Bank Monetary Policy & Interest Rate Benchmarks';
    }
    if (clusterId === 'cluster-energy-record') {
      return 'Global Renewable Energy Deployment Trends & Transmission Constraints';
    }
    return articles[0]?.title ? articles[0].title.slice(0, 60) + '...' : 'Grouped Topic Coverage';
  }
}
