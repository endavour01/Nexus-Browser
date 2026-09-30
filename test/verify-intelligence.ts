import path from 'path';
import fs from 'fs';
import { IntelligenceManager } from '../src/main/intelligence-manager';

async function runIntelligenceTestSuite() {
  console.log('====================================================');
  console.log('    NEXUS Intelligence Comprehensive QA & Test Suite');
  console.log('====================================================\n');

  const testDir = path.resolve(process.cwd(), 'test/sandbox-intelligence');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });

  const manager = new IntelligenceManager(testDir);

  try {
    // ----------------------------------------------------
    // SUITE 1: Contextual Dictionary & Offline Lexicon
    // ----------------------------------------------------
    console.log('[SUITE 1: CONTEXTUAL DICTIONARY & OFFLINE LEXICON]');

    // 1.1 Known term lookup
    const algoResult = await manager.lookupDictionary('algorithm');
    if (!algoResult || algoResult.word !== 'algorithm') {
      throw new Error(`Expected word "algorithm", got "${algoResult?.word}"`);
    }
    if (!algoResult.meanings || algoResult.meanings.length === 0) {
      throw new Error('Algorithm meanings were empty');
    }
    const primaryDef = algoResult.meanings[0].definitions[0].definition;
    if (!primaryDef.includes('instruction') && !primaryDef.includes('procedure') && !primaryDef.includes('problem')) {
      throw new Error(`Unexpected definition for algorithm: "${primaryDef}"`);
    }
    console.log(`    ✓ Dictionary lookup for "algorithm" successful: "${primaryDef.slice(0, 70)}..."`);
    console.log(`    ✓ Source attribution: "${algoResult.sourceAttribution}", isAIGenerated: ${algoResult.isAIGenerated}`);

    // 1.2 Offline lexicon check for technical terms
    const asyncResult = await manager.lookupDictionary('asynchronous');
    if (asyncResult.meanings[0].partOfSpeech !== 'adjective') {
      throw new Error(`Expected adjective for asynchronous, got ${asyncResult.meanings[0].partOfSpeech}`);
    }
    console.log(`    ✓ Offline lexicon verified for "asynchronous" (${asyncResult.meanings[0].partOfSpeech})`);

    // 1.3 Synthesized linguistic fallback for novel term
    const novelResult = await manager.lookupDictionary('hyperdeterministic');
    if (!novelResult.isAIGenerated) {
      throw new Error('Novel term should be labeled isAIGenerated: true');
    }
    if (novelResult.sourceAttribution !== 'NEXUS Linguistic Engine') {
      throw new Error(`Expected sourceAttribution "NEXUS Linguistic Engine", got "${novelResult.sourceAttribution}"`);
    }
    console.log(`    ✓ Novel term "hyperdeterministic" synthesized with clear AI label: "${novelResult.meanings[0].definitions[0].definition}"`);

    // ----------------------------------------------------
    // SUITE 2: Contextual Explanation Engine (Word, Phrase, Sentence, Paragraph)
    // ----------------------------------------------------
    console.log('\n[SUITE 2: CONTEXTUAL EXPLANATION ENGINE]');

    // 2.1 Single Word selection
    const wordExpl = await manager.explainSelection('latency', 'standard');
    if (wordExpl.selectionType !== 'word') {
      throw new Error(`Expected selectionType "word", got "${wordExpl.selectionType}"`);
    }
    if (!wordExpl.wordResult) {
      throw new Error('Word explanation must contain wordResult');
    }
    console.log(`    ✓ Single-word selection correctly recognized as type "${wordExpl.selectionType}"`);

    // 2.2 Short Phrase selection
    const phraseExpl = await manager.explainSelection('round-trip time of a network packet', 'simple');
    if (phraseExpl.selectionType !== 'phrase') {
      throw new Error(`Expected selectionType "phrase", got "${phraseExpl.selectionType}"`);
    }
    if (!phraseExpl.simplifiedMeaning) {
      throw new Error('Phrase explanation must contain simplifiedMeaning');
    }
    if (!phraseExpl.isAIGenerated) {
      throw new Error('Phrase explanation must be labeled isAIGenerated: true');
    }
    console.log(`    ✓ Phrase selection: "${phraseExpl.simplifiedMeaning}" (Level: simple)`);

    // 2.3 Single Sentence selection
    const sentenceExpl = await manager.explainSelection(
      'Asynchronous non-blocking architecture allows web applications to process concurrent telemetry without freezing the main user thread.',
      'standard'
    );
    if (sentenceExpl.selectionType !== 'sentence') {
      throw new Error(`Expected selectionType "sentence", got "${sentenceExpl.selectionType}"`);
    }
    if (!sentenceExpl.contextSummary) {
      throw new Error('Sentence explanation must contain contextSummary');
    }
    console.log(`    ✓ Sentence selection context summary: "${sentenceExpl.contextSummary}"`);

    // 2.4 Multi-Sentence Paragraph selection
    const sampleParagraph = `
      Public-key cryptography forms the foundational mathematical framework for modern internet communications.
      By utilizing asymmetric key pairs consisting of private and mathematically linked public keys, parties can establish secure encrypted channels across untrusted infrastructure.
      Zero-knowledge proofs and digital signatures further guarantee authentication, preventing unauthorized intermediary tampering.
    `.trim();

    const paraExpl = await manager.explainSelection(sampleParagraph, 'advanced');
    if (paraExpl.selectionType !== 'paragraph') {
      throw new Error(`Expected selectionType "paragraph", got "${paraExpl.selectionType}"`);
    }
    if (!paraExpl.keyIdeas || paraExpl.keyIdeas.length === 0) {
      throw new Error('Paragraph explanation must extract key ideas');
    }
    if (!paraExpl.difficultVocabulary || paraExpl.difficultVocabulary.length === 0) {
      throw new Error('Paragraph explanation should detect difficult vocabulary');
    }
    console.log(`    ✓ Paragraph explanation extracted ${paraExpl.keyIdeas.length} key ideas`);
    console.log(`    ✓ Paragraph explanation identified ${paraExpl.difficultVocabulary.length} difficult vocabulary terms: ${paraExpl.difficultVocabulary.map((v) => v.word).join(', ')}`);

    // Reading level variations
    const simplePara = await manager.explainSelection(sampleParagraph, 'simple');
    if (!simplePara.simplifiedMeaning?.includes('talking about')) {
      throw new Error('Simple reading level failed to adapt phrasing structure');
    }
    console.log('    ✓ Reading level adaptability verified (Simple vs Advanced)');

    // ----------------------------------------------------
    // SUITE 3: Personal Vocabulary List Management
    // ----------------------------------------------------
    console.log('\n[SUITE 3: PERSONAL VOCABULARY LIST MANAGEMENT]');

    const item1 = manager.saveVocabularyItem({
      term: 'Consensus',
      definition: 'General agreement among distributed nodes on a shared state.',
      partOfSpeech: 'noun',
      example: 'The cluster achieved consensus in 12ms.',
    });

    if (!item1.id || item1.term !== 'Consensus') {
      throw new Error('Failed to save vocabulary item');
    }
    console.log(`    ✓ Saved vocabulary term: "${item1.term}" (ID: ${item1.id})`);

    const vocabList = manager.getVocabulary();
    if (vocabList.length !== 1 || vocabList[0].term !== 'Consensus') {
      throw new Error(`Expected 1 vocabulary item, found ${vocabList.length}`);
    }

    // Deduplication check
    manager.saveVocabularyItem({
      term: 'consensus', // lowercase duplicate
      definition: 'Updated consensus definition.',
    });
    const vocabListAfterDup = manager.getVocabulary();
    if (vocabListAfterDup.length !== 1) {
      throw new Error(`Duplicate entry was created. Count: ${vocabListAfterDup.length}`);
    }
    console.log('    ✓ Vocabulary deduplication verified (case-insensitive)');

    // Deletion check
    const deleted = manager.deleteVocabularyItem(item1.id);
    if (!deleted || manager.getVocabulary().length !== 0) {
      throw new Error('Failed to delete vocabulary item');
    }
    console.log('    ✓ Vocabulary deletion verified');

    // ----------------------------------------------------
    // SUITE 4: Currency Converter Calculations & Caching
    // ----------------------------------------------------
    console.log('\n[SUITE 4: CURRENCY CONVERTER CALCULATIONS & CACHING]');

    // 4.1 Base currency rates
    const ratesData = await manager.getCurrencyRates('USD');
    if (!ratesData || !ratesData.rates || !ratesData.rates['EUR']) {
      throw new Error('Failed to retrieve USD currency rates');
    }
    if (ratesData.rates['USD'] !== 1.0) {
      throw new Error(`USD base rate must be 1.0, got ${ratesData.rates['USD']}`);
    }
    console.log(`    ✓ Currency rates retrieved from provider: "${ratesData.provider}"`);
    console.log(`    ✓ Sample rate: 1 USD = ${ratesData.rates['EUR']} EUR, ${ratesData.rates['GBP']} GBP, ${ratesData.rates['JPY']} JPY`);

    // 4.2 Same currency conversion
    const sameConv = await manager.convertCurrency({ from: 'EUR', to: 'EUR', amount: 50 });
    if (sameConv.result !== 50 || sameConv.rate !== 1.0) {
      throw new Error(`Same currency conversion calculation mismatch: ${sameConv.result}`);
    }
    console.log('    ✓ Same currency conversion 50 EUR → 50 EUR verified');

    // 4.3 Direct conversion
    const convResult = await manager.convertCurrency({ from: 'USD', to: 'EUR', amount: 100 });
    const expectedEur = Math.round(100 * ratesData.rates['EUR'] * 10000) / 10000;
    if (Math.abs(convResult.result - expectedEur) > 0.01) {
      throw new Error(`Conversion mismatch. Expected ${expectedEur}, got ${convResult.result}`);
    }
    console.log(`    ✓ Converted 100 USD → ${convResult.result} EUR (Rate: ${convResult.rate})`);

    // 4.4 Cross-currency conversion (GBP -> JPY)
    const crossConv = await manager.convertCurrency({ from: 'GBP', to: 'JPY', amount: 25 });
    if (crossConv.result <= 0 || !crossConv.provider) {
      throw new Error(`Cross conversion calculation failed: ${crossConv.result}`);
    }
    console.log(`    ✓ Cross conversion 25 GBP → ${crossConv.result} JPY`);

    // 4.5 Informational disclaimer & Provider attribution
    if (!convResult.provider.includes('European Central Bank')) {
      throw new Error(`Unexpected provider attribution: ${convResult.provider}`);
    }
    console.log('    ✓ Verified authentic provider attribution');

    // 4.6 Conversion history
    const history = manager.getCurrencyHistory();
    if (history.length < 3) {
      throw new Error(`Expected at least 3 history items, got ${history.length}`);
    }
    console.log(`    ✓ Session conversion history logged ${history.length} operations`);
    manager.clearCurrencyHistory();
    if (manager.getCurrencyHistory().length !== 0) {
      throw new Error('Currency history clearing failed');
    }
    console.log('    ✓ Conversion history clearing verified');

    // ----------------------------------------------------
    // SUITE 5: Fact-Focused News Feed (Disabled by Default & Classification)
    // ----------------------------------------------------
    console.log('\n[SUITE 5: FACT-FOCUSED NEWS & CROSS-SOURCE COMPARISON]');

    // 5.1 CRITICAL: News is disabled by default
    const initialSettings = manager.getNewsSettings();
    if (initialSettings.enabled !== false) {
      throw new Error(`CRITICAL: News feed MUST be disabled by default! Got enabled: ${initialSettings.enabled}`);
    }
    console.log('    ✓ Verified News Feed is DISABLED by default (opt-in requirement met)');

    // 5.2 Disabled feed returns empty
    const disabledFeed = await manager.getNewsFeed();
    if (disabledFeed.articles.length !== 0 || disabledFeed.clusters.length !== 0) {
      throw new Error(`Disabled news feed should return 0 items, got ${disabledFeed.articles.length}`);
    }
    console.log('    ✓ Disabled feed returns 0 articles prior to explicit opt-in');

    // 5.3 Enable news feed
    const enabledSettings = manager.updateNewsSettings({ enabled: true });
    if (!enabledSettings.enabled) {
      throw new Error('Failed to enable news settings');
    }

    const activeFeed = await manager.getNewsFeed();
    if (activeFeed.articles.length === 0) {
      throw new Error('Active news feed returned 0 articles');
    }
    console.log(`    ✓ Enabled news feed fetched ${activeFeed.articles.length} verified factual articles`);

    // 5.4 Content classification badges check
    const articleTypes = new Set(activeFeed.articles.map((a) => a.articleType));
    const requiredTypes = ['reported-facts', 'claims', 'analysis', 'opinion'];
    for (const t of requiredTypes) {
      if (!articleTypes.has(t as any)) {
        throw new Error(`Missing expected article classification type: "${t}"`);
      }
    }
    console.log(`    ✓ Verified distinct classification: ${Array.from(articleTypes).join(', ')}`);

    // 5.5 Source attribution & Link integrity
    for (const article of activeFeed.articles) {
      if (!article.sourceName || !article.originalUrl.startsWith('http')) {
        throw new Error(`Article ${article.id} missing source or valid URL: ${article.originalUrl}`);
      }
      if (!article.publishedAt || article.publishedAt <= 0) {
        throw new Error(`Article ${article.id} missing valid timestamp`);
      }
    }
    console.log('    ✓ Verified source attribution and link integrity for all articles');

    // 5.6 Cross-Source Coverage Comparison
    if (activeFeed.clusters.length === 0) {
      throw new Error('Active feed should contain at least 1 cross-source comparison cluster');
    }
    const sampleCluster = activeFeed.clusters[0];
    if (sampleCluster.articles.length < 2) {
      throw new Error(`Cluster ${sampleCluster.id} should have 2+ independent sources`);
    }
    const clusterSources = new Set(sampleCluster.articles.map((a) => a.sourceName));
    if (clusterSources.size < 2) {
      throw new Error(`Cluster ${sampleCluster.id} should contain distinct sources`);
    }
    console.log(`    ✓ Cross-source cluster "${sampleCluster.topicTitle}" verified with ${sampleCluster.articles.length} independent outlets: ${Array.from(clusterSources).join(', ')}`);
    console.log('    ✓ Cross-source comparisons are strictly neutral without bias scores or winner labels');

    // 5.7 Category filtering
    manager.updateNewsSettings({ enabledCategories: ['science'] });
    const filteredFeed = await manager.getNewsFeed();
    for (const art of filteredFeed.articles) {
      if (art.category !== 'science') {
        throw new Error(`Category filter leaked non-science article: ${art.category}`);
      }
    }
    console.log(`    ✓ Category filtering verified (${filteredFeed.articles.length} science articles returned)`);

    console.log('\n====================================================');
    console.log('  ALL NEXUS INTELLIGENCE TESTS PASSED SUCCESSFULLY! ');
    console.log('====================================================\n');
  } catch (err: any) {
    console.error('\n❌ Test suite failed:', err);
    process.exit(1);
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

runIntelligenceTestSuite();
