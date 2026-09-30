// Offline local spell checking and autocorrect engine for NEXUS Notes

// Common typo corrections dictionary
export const COMMON_TYPOS: Record<string, string> = {
  teh: 'the',
  hte: 'the',
  adn: 'and',
  waht: 'what',
  thsi: 'this',
  becuase: 'because',
  becasue: 'because',
  recieve: 'receive',
  recieved: 'received',
  recieving: 'receiving',
  seperate: 'separate',
  seperated: 'separated',
  definately: 'definitely',
  occured: 'occurred',
  occuring: 'occurring',
  untill: 'until',
  wierd: 'weird',
  alot: 'a lot',
  calender: 'calendar',
  accomodate: 'accommodate',
  embarass: 'embarrass',
  existance: 'existence',
  beleive: 'believe',
  neccessary: 'necessary',
  succesful: 'successful',
  truely: 'truly',
  goverment: 'government',
  enviornment: 'environment',
  tommorrow: 'tomorrow',
  widht: 'width',
  heigth: 'height',
  lenght: 'length',
  accross: 'across',
  allways: 'always',
  begining: 'beginning',
  colleague: 'colleague',
  collegue: 'colleague',
  dissapear: 'disappear',
  embarassing: 'embarrassing',
  foriegn: 'foreign',
  freind: 'friend',
  garantee: 'guarantee',
  grammer: 'grammar',
  guage: 'gauge',
  harrass: 'harass',
  interupt: 'interrupt',
  knowlege: 'knowledge',
  liason: 'liaison',
  millenium: 'millennium',
  noticable: 'noticeable',
  paralell: 'parallel',
  priviledge: 'privilege',
  reccomend: 'recommend',
  refering: 'referring',
  religous: 'religious',
  resistence: 'resistance',
  sence: 'sense',
  similiar: 'similar',
  supercede: 'supersede',
  suprise: 'surprise',
  tendancy: 'tendency',
  threshhold: 'threshold',
  unforseen: 'unforeseen',
  writting: 'writing',
  yeild: 'yield',
};

// Curated offline English and technical dictionary
export const LOCAL_DICTIONARY = new Set<string>([
  // Basic vocabulary
  'a', 'about', 'above', 'across', 'act', 'active', 'activity', 'add', 'after', 'again', 'against',
  'age', 'ago', 'air', 'all', 'almost', 'alone', 'along', 'already', 'also', 'although', 'always',
  'am', 'among', 'an', 'and', 'another', 'answer', 'any', 'anyone', 'anything', 'appear', 'apple',
  'apply', 'area', 'arm', 'around', 'art', 'article', 'as', 'ask', 'at', 'author', 'auto', 'away',
  'back', 'bad', 'balance', 'ball', 'bank', 'bar', 'base', 'basic', 'be', 'bear', 'beat', 'beautiful',
  'because', 'become', 'bed', 'before', 'begin', 'behind', 'believe', 'bell', 'best', 'better', 'between',
  'big', 'bird', 'birth', 'bit', 'black', 'block', 'blood', 'blow', 'blue', 'board', 'boat', 'body',
  'book', 'both', 'bottom', 'box', 'boy', 'branch', 'bread', 'break', 'bright', 'bring', 'brother',
  'brown', 'build', 'burn', 'business', 'but', 'buy', 'by', 'call', 'can', 'capital', 'car', 'card',
  'care', 'carry', 'case', 'catch', 'cause', 'center', 'century', 'certain', 'chair', 'chance', 'change',
  'character', 'charge', 'chart', 'check', 'child', 'choose', 'church', 'circle', 'city', 'claim',
  'class', 'clean', 'clear', 'climb', 'clock', 'close', 'cloth', 'cloud', 'coast', 'coat', 'cold',
  'collect', 'color', 'come', 'common', 'company', 'compare', 'complete', 'concept', 'condition',
  'connect', 'consider', 'contain', 'continue', 'control', 'cook', 'cool', 'copy', 'corner', 'correct',
  'cost', 'cotton', 'could', 'count', 'country', 'course', 'cover', 'cow', 'create', 'crop', 'cross',
  'crowd', 'cry', 'current', 'cut', 'daily', 'dark', 'data', 'date', 'daughter', 'day', 'dead', 'deal',
  'dear', 'death', 'decide', 'decision', 'deep', 'degree', 'depend', 'describe', 'design', 'desk',
  'detail', 'determine', 'develop', 'device', 'die', 'difference', 'different', 'difficult', 'direct',
  'direction', 'directory', 'discover', 'discuss', 'disease', 'distance', 'divide', 'do', 'doctor',
  'document', 'dog', 'dollar', 'door', 'double', 'doubt', 'down', 'draw', 'dream', 'dress', 'drink',
  'drive', 'drop', 'dry', 'due', 'during', 'each', 'early', 'earth', 'ease', 'east', 'easy', 'eat',
  'edge', 'editor', 'effect', 'egg', 'eight', 'either', 'electric', 'element', 'else', 'empty', 'end',
  'enemy', 'engine', 'enjoy', 'enough', 'enter', 'entire', 'equal', 'equation', 'error', 'escape',
  'especial', 'even', 'evening', 'event', 'ever', 'every', 'everyone', 'exact', 'example', 'except',
  'excite', 'exercise', 'expect', 'experience', 'experiment', 'explain', 'eye', 'face', 'fact',
  'fair', 'fall', 'family', 'famous', 'far', 'farm', 'fast', 'fat', 'father', 'favor', 'fear', 'feed',
  'feel', 'feeling', 'few', 'field', 'fig', 'fight', 'figure', 'fill', 'final', 'find', 'fine',
  'finger', 'finish', 'fire', 'first', 'fish', 'fit', 'five', 'fix', 'flag', 'flat', 'floor', 'flow',
  'flower', 'fly', 'focus', 'fold', 'folder', 'follow', 'food', 'foot', 'for', 'force', 'forest',
  'form', 'format', 'forward', 'found', 'four', 'frame', 'free', 'fresh', 'friend', 'from', 'front',
  'fruit', 'full', 'function', 'game', 'garden', 'gas', 'gather', 'general', 'gentle', 'get', 'girl',
  'give', 'glad', 'glass', 'go', 'gold', 'golden', 'good', 'govern', 'government', 'grand', 'grass',
  'gray', 'great', 'green', 'ground', 'group', 'grow', 'guess', 'guide', 'gun', 'hair', 'half',
  'hand', 'happen', 'happy', 'hard', 'has', 'hat', 'have', 'he', 'head', 'hear', 'heart', 'heat',
  'heavy', 'help', 'her', 'here', 'high', 'hill', 'him', 'his', 'history', 'hit', 'hold', 'hole',
  'home', 'hope', 'horse', 'hot', 'hour', 'house', 'how', 'huge', 'human', 'hundred', 'hunt', 'hurry',
  'idea', 'if', 'image', 'imagine', 'important', 'in', 'inch', 'include', 'indicate', 'industry',
  'inform', 'input', 'inside', 'instead', 'instrument', 'interest', 'into', 'iron', 'is', 'island',
  'issue', 'it', 'item', 'its', 'job', 'join', 'journey', 'joy', 'judge', 'jump', 'just', 'keep',
  'key', 'kill', 'kind', 'king', 'knew', 'know', 'knowledge', 'lake', 'land', 'language', 'large',
  'last', 'late', 'laugh', 'law', 'lay', 'lead', 'leader', 'leaf', 'learn', 'leave', 'left', 'leg',
  'length', 'less', 'lesson', 'let', 'letter', 'level', 'lie', 'life', 'lift', 'light', 'like',
  'line', 'link', 'list', 'listen', 'little', 'live', 'load', 'locate', 'log', 'lone', 'long',
  'look', 'loud', 'love', 'low', 'machine', 'made', 'main', 'major', 'make', 'man', 'many', 'map',
  'mark', 'market', 'mass', 'master', 'match', 'material', 'matter', 'may', 'me', 'mean', 'measure',
  'meat', 'meet', 'meeting', 'member', 'memory', 'men', 'mention', 'message', 'method', 'middle',
  'might', 'mile', 'milk', 'million', 'mind', 'mine', 'minute', 'miss', 'mix', 'modern', 'molecule',
  'moment', 'money', 'month', 'moon', 'more', 'morning', 'most', 'mother', 'motion', 'mount',
  'mountain', 'mouth', 'move', 'much', 'music', 'must', 'my', 'name', 'nation', 'native', 'natural',
  'nature', 'near', 'necessary', 'neck', 'need', 'neighbor', 'neither', 'never', 'new', 'next',
  'night', 'nine', 'no', 'noon', 'nor', 'north', 'nose', 'not', 'note', 'notebook', 'notes', 'nothing',
  'notice', 'noun', 'now', 'number', 'numeral', 'object', 'observe', 'occur', 'ocean', 'of', 'off',
  'offer', 'office', 'often', 'oh', 'oil', 'old', 'on', 'once', 'one', 'only', 'open', 'operate',
  'opinion', 'order', 'organize', 'original', 'other', 'our', 'out', 'over', 'own', 'oxygen', 'page',
  'paint', 'pair', 'paper', 'paragraph', 'part', 'particular', 'party', 'pass', 'past', 'path',
  'pattern', 'pay', 'pencil', 'people', 'per', 'perform', 'performance', 'period', 'person', 'picture',
  'piece', 'pin', 'pinned', 'pitch', 'place', 'plain', 'plan', 'plane', 'planet', 'plant', 'play',
  'please', 'plural', 'point', 'poor', 'populate', 'position', 'possible', 'post', 'pound', 'power',
  'practice', 'prepare', 'present', 'press', 'pretty', 'prevent', 'print', 'probable', 'problem',
  'process', 'produce', 'product', 'project', 'proper', 'property', 'protect', 'prove', 'provide',
  'pull', 'pure', 'push', 'put', 'quart', 'question', 'quick', 'quiet', 'quite', 'quote', 'race',
  'radio', 'rain', 'raise', 'ran', 'range', 'rapid', 'rather', 'reach', 'read', 'reading', 'ready',
  'real', 'reason', 'receive', 'record', 'red', 'reduce', 'region', 'relative', 'release', 'remain',
  'remember', 'repeat', 'reply', 'represent', 'require', 'research', 'rest', 'result', 'return',
  'review', 'rhythm', 'rich', 'ride', 'right', 'ring', 'rise', 'river', 'road', 'rock', 'roll',
  'room', 'root', 'rope', 'rose', 'round', 'row', 'rub', 'rule', 'run', 'safe', 'said', 'sail',
  'same', 'sand', 'sat', 'save', 'saved', 'saving', 'saw', 'say', 'scale', 'school', 'science',
  'scientist', 'score', 'sea', 'search', 'season', 'seat', 'second', 'section', 'see', 'seed',
  'seem', 'segment', 'select', 'self', 'sell', 'send', 'sense', 'sentence', 'separate', 'serve',
  'service', 'set', 'settle', 'seven', 'several', 'shall', 'shape', 'share', 'sharp', 'she', 'sheet',
  'shell', 'shine', 'ship', 'shoe', 'shop', 'shore', 'short', 'should', 'shoulder', 'shout', 'show',
  'side', 'sight', 'sign', 'signal', 'silent', 'silver', 'similar', 'simple', 'since', 'sing',
  'single', 'sister', 'sit', 'six', 'size', 'skill', 'skin', 'sky', 'slave', 'sleep', 'slip', 'slow',
  'small', 'smell', 'smile', 'smoke', 'snow', 'so', 'soft', 'soil', 'soldier', 'solid', 'solution',
  'solve', 'some', 'son', 'song', 'soon', 'sound', 'source', 'south', 'space', 'speak', 'special',
  'speed', 'spell', 'spend', 'spoke', 'spot', 'spread', 'spring', 'square', 'stand', 'star', 'start',
  'state', 'statement', 'station', 'stay', 'stead', 'steam', 'steel', 'step', 'stick', 'still',
  'stone', 'stood', 'stop', 'store', 'story', 'straight', 'strange', 'stream', 'street', 'stretch',
  'string', 'strong', 'student', 'study', 'subject', 'substance', 'succeed', 'success', 'such',
  'sudden', 'suffix', 'sugar', 'suggest', 'suit', 'summer', 'sun', 'supply', 'support', 'sure',
  'surface', 'surprise', 'swim', 'syllable', 'symbol', 'system', 'table', 'tail', 'take', 'talk',
  'tall', 'task', 'teach', 'team', 'tell', 'temperature', 'ten', 'term', 'test', 'than', 'thank',
  'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'thick', 'thin', 'thing',
  'think', 'third', 'this', 'those', 'though', 'thought', 'thousand', 'three', 'through', 'throw',
  'thus', 'tie', 'time', 'tiny', 'tire', 'to', 'today', 'together', 'told', 'tomorrow', 'tone',
  'too', 'took', 'tool', 'toolbar', 'top', 'total', 'touch', 'toward', 'town', 'track', 'trade',
  'traffic', 'train', 'travel', 'tree', 'triangle', 'trip', 'trouble', 'true', 'truck', 'tube',
  'turn', 'twenty', 'two', 'type', 'under', 'understand', 'unit', 'until', 'up', 'upon', 'us',
  'use', 'usual', 'valley', 'value', 'vary', 'verb', 'very', 'view', 'village', 'visit', 'voice',
  'vowel', 'wait', 'walk', 'wall', 'want', 'war', 'warm', 'was', 'wash', 'watch', 'water', 'wave',
  'way', 'we', 'wear', 'weather', 'weight', 'welcome', 'well', 'went', 'were', 'west', 'what',
  'wheel', 'when', 'where', 'whether', 'which', 'while', 'white', 'who', 'whole', 'whose', 'why',
  'wide', 'wife', 'wild', 'will', 'win', 'wind', 'window', 'wing', 'winter', 'wire', 'wish',
  'with', 'within', 'without', 'woman', 'women', 'wonder', 'wood', 'word', 'work', 'workspace',
  'world', 'would', 'write', 'wrong', 'yard', 'year', 'yellow', 'yes', 'yesterday', 'yet', 'you',
  'young', 'your',

  // Tech, Developer & Browser Domain Vocabulary
  'nexus', 'browser', 'react', 'tiptap', 'javascript', 'typescript', 'electron', 'vite', 'node',
  'dom', 'html', 'css', 'api', 'async', 'await', 'promise', 'function', 'class', 'const', 'let',
  'var', 'export', 'import', 'default', 'interface', 'type', 'enum', 'null', 'undefined', 'boolean',
  'string', 'number', 'array', 'object', 'json', 'sql', 'sqlite', 'database', 'query', 'schema',
  'table', 'column', 'row', 'index', 'key', 'primary', 'foreign', 'filter', 'sort', 'search',
  'cache', 'storage', 'session', 'cookie', 'token', 'auth', 'oauth', 'jwt', 'security', 'shield',
  'tracking', 'privacy', 'permission', 'extension', 'tab', 'workspace', 'profile', 'theme', 'dark',
  'light', 'balanced', 'performance', 'mode', 'canvas', 'sketch', 'draw', 'drawing', 'diagram',
  'chart', 'flowchart', 'mindmap', 'export', 'pdf', 'print', 'download', 'upload', 'file', 'folder',
  'notebook', 'tag', 'favorite', 'archive', 'trash', 'recycle', 'bin', 'restore', 'purge', 'draft',
  'recovery', 'autosave', 'status', 'heading', 'bold', 'italic', 'underline', 'strikethrough',
  'blockquote', 'codeblock', 'checklist', 'checkbox', 'template', 'snippet', 'clipboard', 'undo',
  'redo', 'shortcut', 'hotkey', 'popover', 'modal', 'dialog', 'sidebar', 'toolbar', 'navbar',
  'network', 'request', 'response', 'header', 'statuscode', 'payload', 'buffer', 'stream', 'uri',
  'url', 'hostname', 'domain', 'protocol', 'port', 'path', 'hash', 'queryparams', 'href', 'src',
  'technology', 'technologies', 'technical', 'software', 'hardware', 'system', 'systems',
  'computer', 'algorithm', 'consensus', 'architecture', 'spec', 'distributed', 'quorum', 'raft',
]);

// Compute Levenshtein distance between two strings
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Check if a word is potentially misspelled
export function isWordMisspelled(rawWord: string): boolean {
  const word = rawWord.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
  if (!word || word.length <= 1) return false;

  // Ignore numbers, hex values, URLs, snake_case or camelCase variables
  if (/^\d+$/.test(word)) return false;
  if (/^0x[0-9a-fA-F]+$/.test(word)) return false;
  if (word.includes('_') || word.includes('-') || word.includes('/') || word.includes('.')) return false;
  // If mixed case like camelCase (e.g. getNotes, innerHTML), treat as code/technical term
  if (/[a-z][A-Z]/.test(word)) return false;

  const lower = word.toLowerCase();
  if (LOCAL_DICTIONARY.has(lower)) return false;

  // Common inflections (s, es, ed, ing, ly, er, est)
  if (lower.endsWith('s') && LOCAL_DICTIONARY.has(lower.slice(0, -1))) return false;
  if (lower.endsWith('es') && LOCAL_DICTIONARY.has(lower.slice(0, -2))) return false;
  if (lower.endsWith('ed') && LOCAL_DICTIONARY.has(lower.slice(0, -2))) return false;
  if (lower.endsWith('ing') && LOCAL_DICTIONARY.has(lower.slice(0, -3))) return false;
  if (lower.endsWith('ly') && LOCAL_DICTIONARY.has(lower.slice(0, -2))) return false;

  return true;
}

// Get suggestions for a misspelled word
export function getSpellingSuggestions(rawWord: string, maxSuggestions = 4): string[] {
  const word = rawWord.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
  if (!word) return [];

  const lower = word.toLowerCase();
  const suggestions: string[] = [];

  // 1. Direct typo dictionary check
  if (COMMON_TYPOS[lower]) {
    suggestions.push(matchCasing(word, COMMON_TYPOS[lower]));
  }

  // 2. Levenshtein edit distance check (threshold distance <= 2)
  const candidates: { word: string; dist: number }[] = [];
  LOCAL_DICTIONARY.forEach((dictWord) => {
    // Optimization: skip if length difference is > 2
    if (Math.abs(dictWord.length - lower.length) > 2) return;
    const dist = levenshteinDistance(lower, dictWord);
    if (dist <= 2) {
      candidates.push({ word: dictWord, dist });
    }
  });

  candidates.sort((a, b) => a.dist - b.dist);

  for (const c of candidates) {
    const formatted = matchCasing(word, c.word);
    if (!suggestions.includes(formatted)) {
      suggestions.push(formatted);
    }
    if (suggestions.length >= maxSuggestions) break;
  }

  return suggestions;
}

// Autocorrect a word if it exists in the common typos table
export function autocorrectWord(rawWord: string): { corrected: string; wasCorrected: boolean } {
  const match = rawWord.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9]+)([^a-zA-Z0-9]*)$/);
  if (!match) return { corrected: rawWord, wasCorrected: false };

  const [, prefix, word, suffix] = match;
  const lower = word.toLowerCase();

  if (COMMON_TYPOS[lower]) {
    const replaced = matchCasing(word, COMMON_TYPOS[lower]);
    return {
      corrected: `${prefix}${replaced}${suffix}`,
      wasCorrected: true,
    };
  }

  return { corrected: rawWord, wasCorrected: false };
}

// Preserve capitalization pattern (Capitalized, UPPERCASE, lowercase)
function matchCasing(source: string, target: string): string {
  if (source === source.toUpperCase() && source.length > 1) {
    return target.toUpperCase();
  }
  if (source[0] === source[0].toUpperCase()) {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }
  return target.toLowerCase();
}
