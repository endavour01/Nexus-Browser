export interface TabState {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  workspaceId: string;
  isPinned?: boolean;
  groupId?: string;
  isMuted?: boolean;
  hasAudio?: boolean;
  isSecure?: boolean;
  isPrivate?: boolean;
  errorCode?: number;
  errorDescription?: string;
  isSuspended?: boolean;
  suspendedAt?: number;
}

export interface TabGroup {
  id: string;
  name: string;
  color: string;
  collapsed?: boolean;
}

export interface PinnedSiteItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export interface WorkspaceLayout {
  sidebarCollapsed?: boolean;
  tabLayout?: 'horizontal' | 'vertical';
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
  isolatedSession?: boolean;
  pinnedSites?: PinnedSiteItem[];
  layout?: WorkspaceLayout;
}

export interface RecentlyClosedTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  workspaceId: string;
  groupId?: string;
  closedAt: number;
}

export interface SavedSessionData {
  version: number;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  groups: TabGroup[];
  tabs: Array<{
    id: string;
    url: string;
    title: string;
    favicon?: string;
    workspaceId: string;
    groupId?: string;
    isPinned?: boolean;
    isMuted?: boolean;
  }>;
  activeTabId: string | null;
  recentlyClosed: RecentlyClosedTab[];
}

export interface ContentBounds {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface BookmarkItem {
  id: string;
  type: 'bookmark' | 'folder';
  title: string;
  url?: string;
  favicon?: string;
  parentId?: string | null; // 'toolbar' | 'other' | custom folder id | null
  createdAt: number;
  updatedAt?: number;
}

export type Bookmark = BookmarkItem;

export interface HistoryEntry {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  timestamp: number;
  visitCount: number;
}

export interface ClearDataOptions {
  timeRange: '1h' | '24h' | '7d' | '4w' | 'all';
  history: boolean;
  downloads: boolean;
  cookies: boolean;
  cache: boolean;
  sitePermissions?: boolean;
}

export interface DownloadRecord {
  id: string;
  filename: string;
  url: string;
  savePath: string;
  mimeType?: string;
  receivedBytes: number;
  totalBytes: number;
  filesize: string;
  speed: string;
  progress: number; // 0 - 100
  status: 'progressing' | 'paused' | 'completed' | 'cancelled' | 'interrupted';
  stateReason?: string;
  startTime: number;
  endTime?: number;
  canResume: boolean;
}

export type DownloadItem = DownloadRecord;

export interface ExtensionCompatibility {
  status: 'compatible' | 'partially_compatible' | 'incompatible';
  notes: string[];
  unsupportedPermissions: string[];
}

export interface ExtensionPermissionWarning {
  permission: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface InstalledExtension {
  id: string;
  name: string;
  version: string;
  description: string;
  path: string;
  enabled: boolean;
  manifestVersion: number;
  permissions: string[];
  hostPermissions: string[];
  icons?: Record<string, string>;
  iconDataUrl?: string;
  action?: {
    title?: string;
    popup?: string;
    icon?: string;
  };
  homepageUrl?: string;
  installedAt: number;
  compatibility: ExtensionCompatibility;
  error?: string;
}

export type ExtensionItem = InstalledExtension;

export interface ExtensionValidationResult {
  valid: boolean;
  name: string;
  version: string;
  description: string;
  manifestVersion: number;
  path: string;
  permissions: string[];
  hostPermissions: string[];
  warnings: ExtensionPermissionWarning[];
  compatibility: ExtensionCompatibility;
  action?: {
    title?: string;
    popup?: string;
    icon?: string;
  };
  iconDataUrl?: string;
  error?: string;
}

export type ThemePreference = 'dark' | 'light' | 'system';
export type NexusBrowserMode = 'default' | 'balanced' | 'performance';

export interface ModeBehaviorConfig {
  tabInactivityThresholdMs: number;
  autoSuspendEnabled: boolean;
  backgroundThrottlingEnabled: boolean;
  suspendPinnedTabs: boolean;
  lightweightUIEnabled: boolean;
  distractionReductionEnabled: boolean;
  minimalToolbarEnabled: boolean;
}

export interface ModeTelemetry {
  activeMode: NexusBrowserMode;
  memoryUsageMB: number;
  heapUsedMB: number;
  heapTotalMB: number;
  suspendedTabsCount: number;
  totalTabsCount: number;
  activeTabsCount: number;
  estimatedMemorySavedMB: number;
  backgroundThrottlingEnabled: boolean;
  autoSuspensionEnabled: boolean;
  inactivityThresholdMs: number;
  lightweightUIEnabled: boolean;
  featuresEnabled: {
    backgroundThrottling: boolean;
    autoTabSuspension: boolean;
    lightweightUI: boolean;
    distractionReduction: boolean;
    pinnedProtection: boolean;
    audioProtection: boolean;
    downloadProtection: boolean;
  };
}

export interface BrowserSettings {
  searchEngine: 'duckduckgo' | 'google' | 'brave' | 'bing';
  theme?: ThemePreference;
  mode?: NexusBrowserMode;
  reducedMotion?: boolean;
  defaultZoom: number;
  openDevToolsOnStart: boolean;
  hardwareAcceleration: boolean;
  restoreSessionOnStartup: boolean;
  tabLayout: 'horizontal' | 'vertical';
  showBookmarksBar?: boolean;
  defaultDownloadDirectory?: string;
  trackingProtectionMode?: TrackingProtectionMode;
  javascriptEnabled?: boolean;
  popupsBlocked?: boolean;
  thirdPartyCookiesBlocked?: boolean;
  shieldEnabled?: boolean;
  shieldAdBlocking?: boolean;
  shieldTrackerBlocking?: boolean;
  shieldPopupBlocking?: boolean;
  shieldPhishingProtection?: boolean;
  shieldStrictMode?: boolean;
  performanceTabDiscardTimeout?: number;
  performanceAutoSuspend?: boolean;
  performanceBackgroundThrottling?: boolean;
  performanceSuspendPinned?: boolean;
  performanceLightweightUI?: boolean;
  balancedDistractionReduction?: boolean;
  balancedMinimalToolbar?: boolean;
  hubEnabled?: boolean;
  todoEnabled?: boolean;
}

// NEXUS Shield Types
export type ThreatType = 'phishing' | 'malware' | 'scam' | 'deceptive';

export interface ShieldFilterList {
  id: string;
  name: string;
  description: string;
  url: string;
  enabled: boolean;
  ruleCount: number;
  lastUpdated: number;
  format?: 'adblock' | 'hosts' | 'domains';
}

export interface NexusShieldSettings {
  enabled: boolean;
  adBlockingEnabled: boolean;
  trackerBlockingEnabled: boolean;
  popupBlockingEnabled: boolean;
  phishingProtectionEnabled: boolean;
  strictMode: boolean;
  filterLists: ShieldFilterList[];
  allowlist: string[]; // origins where Shield is disabled
  popupAllowlist: string[]; // origins allowed to open popups
  temporaryPauseUntil: number | null; // timestamp when pause expires
}

export interface TabShieldStats {
  tabId: string;
  url: string;
  origin: string;
  adsBlocked: number;
  trackersBlocked: number;
  popupsBlocked: number;
  threatsBlocked: number;
  totalBlocked: number;
  isAllowlisted: boolean;
  isPaused: boolean;
}

export interface NexusShieldStats {
  totalAdsBlocked: number;
  totalTrackersBlocked: number;
  totalPopupsBlocked: number;
  totalThreatsBlocked: number;
  totalBlocked: number;
  lastUpdated: number;
}

export interface SystemInfo {
  electron: string;
  chrome: string;
  node: string;
  platform: string;
  arch: string;
}

// User Profiles
export interface UserProfile {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: number;
  isDefault?: boolean;
}

// Site Permissions & Content Settings
export type PermissionType =
  | 'camera'
  | 'microphone'
  | 'geolocation'
  | 'notifications'
  | 'midi'
  | 'pointerLock'
  | 'fullscreen'
  | 'openExternal';

export type PermissionDecision = 'allow' | 'deny' | 'ask';

export interface SitePermissionRule {
  origin: string;
  permission: PermissionType;
  decision: PermissionDecision;
  updatedAt: number;
}

export interface PermissionPromptRequest {
  requestId: string;
  tabId: string;
  origin: string;
  permission: PermissionType;
  title: string;
}

// Security & Certificate Info
export interface CertificateInfo {
  subjectName: string;
  issuerName: string;
  validFrom: number;
  validTo: number;
  fingerprint: string;
  serialNumber: string;
  protocol?: string;
  cipher?: string;
}

export interface SiteSecurityInfo {
  url: string;
  origin: string;
  isSecure: boolean;
  status: 'secure' | 'insecure' | 'warning';
  certificate?: CertificateInfo;
  error?: string;
  blockedTrackersCount: number;
}

export interface CertificateErrorDetails {
  url: string;
  error: string;
  errorDescription: string;
  certificate?: CertificateInfo;
}

// Tracking Protection
export type TrackingProtectionMode = 'off' | 'standard' | 'strict';

export interface TrackingProtectionSettings {
  mode: TrackingProtectionMode;
  totalBlocked: number;
  exceptions: string[];
}

export interface ContentSettings {
  javascriptEnabled: boolean;
  popupsBlocked: boolean;
  thirdPartyCookiesBlocked: boolean;
}

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Tabs' | 'Navigation' | 'Workspaces' | 'Tools' | 'Bookmarks & History' | 'Developer';
  shortcut?: string;
  icon?: string;
  action: () => void;
}

export interface RecentPage {
  title: string;
  url: string;
  timestamp: number;
}

export type SidePanelType = 'bookmarks' | 'downloads' | 'extensions' | 'profiles' | 'settings' | 'history' | 'devtools' | 'notes' | 'intelligence' | 'markets' | 'hub' | 'todo' | null;

// Developer Tools Types
export interface NetworkLogEntry {
  id: string;
  tabId: string;
  url: string;
  method: string;
  statusCode?: number;
  statusLine?: string;
  resourceType: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  size?: number;
  error?: string;
  ip?: string;
}

export interface CookieItem {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  session: boolean;
  expirationDate?: number;
  sameSite: 'unspecified' | 'no_restriction' | 'lax' | 'strict';
}

export interface StorageItem {
  key: string;
  value: string;
}

export interface StorageData {
  localStorage: StorageItem[];
  sessionStorage: StorageItem[];
}

export interface PageInfoDetails {
  url: string;
  title: string;
  viewportSize: { width: number; height: number };
  contentType?: string;
  security: SiteSecurityInfo;
  cookieCount: number;
  storageCount: number;
}

export interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  mobile: boolean;
  userAgent?: string;
}

export interface ReaderArticle {
  title: string;
  byline?: string;
  siteName?: string;
  content: string;
  textContent: string;
  length: number;
  excerpt?: string;
  readingTimeMinutes: number;
}

export interface ReaderResult {
  success: boolean;
  article?: ReaderArticle;
  reason?: string;
}

export interface SiteZoomPreference {
  origin: string;
  zoomFactor: number;
  updatedAt: number;
}

// NEXUS Notes Types
export interface NexusNoteLinkedTab {
  url: string;
  title: string;
  favicon?: string;
  linkedAt: number;
}

export interface NexusNote {
  id: string;
  title: string;
  content: string;
  notebookId: string;
  folderId?: string | null;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  isArchived: boolean;
  inTrash: boolean;
  trashedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  linkedTab?: NexusNoteLinkedTab | null;
  drawingData?: string | null;
  wordCount?: number;
  readingTimeMinutes?: number;
}

export interface NexusNotebook {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  createdAt: number;
  updatedAt: number;
}

export interface NexusFolder {
  id: string;
  notebookId: string;
  name: string;
  parentId?: string | null;
  createdAt: number;
}

export interface NexusDraftRecovery {
  noteId: string;
  title: string;
  content: string;
  timestamp: number;
}

export interface NotesFilterOptions {
  searchQuery?: string;
  notebookId?: string;
  folderId?: string | null;
  tag?: string;
  favoriteOnly?: boolean;
  pinnedOnly?: boolean;
  archivedOnly?: boolean;
  trashOnly?: boolean;
  linkedUrl?: string;
}

export interface NotesExportOptions {
  includeTitle?: boolean;
  includeMetadata?: boolean;
  includePageNumbers?: boolean;
  theme?: 'light' | 'dark' | 'system';
}

export interface NexusNotesData {
  version: number;
  notes: NexusNote[];
  notebooks: NexusNotebook[];
  folders: NexusFolder[];
  drafts: Record<string, NexusDraftRecovery>;
}

// ==========================================
// NEXUS Intelligence Types
// ==========================================
export type IntelligenceReadingLevel = 'simple' | 'standard' | 'advanced';

export interface DictionaryDefinition {
  partOfSpeech: string;
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface DictionaryPhonetic {
  text?: string;
  audio?: string;
}

export interface DictionaryWordResult {
  word: string;
  phonetics?: DictionaryPhonetic[];
  meanings: {
    partOfSpeech: string;
    definitions: DictionaryDefinition[];
    synonyms?: string[];
    antonyms?: string[];
  }[];
  sourceUrl?: string;
  sourceAttribution: string;
  isAIGenerated: boolean;
}

export interface ContextualExplanation {
  originalText: string;
  selectionType: 'word' | 'phrase' | 'sentence' | 'paragraph';
  simplifiedMeaning?: string;
  contextSummary?: string;
  keyIdeas?: string[];
  difficultVocabulary?: { word: string; definition: string }[];
  readingLevel: IntelligenceReadingLevel;
  targetLanguage: string;
  sourceAttribution: string;
  isAIGenerated: boolean;
  wordResult?: DictionaryWordResult;
}

export interface VocabularyItem {
  id: string;
  term: string;
  definition: string;
  partOfSpeech?: string;
  example?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  dateAdded: number;
  tags?: string[];
}

export interface CurrencyRateData {
  base: string;
  date: string;
  timestamp: number;
  provider: string;
  rates: Record<string, number>;
  isStale?: boolean;
}

export interface CurrencyConversionRequest {
  from: string;
  to: string;
  amount: number;
}

export interface CurrencyConversionResult {
  from: string;
  to: string;
  amount: number;
  rate: number;
  result: number;
  timestamp: number;
  provider: string;
  isStale: boolean;
}

export interface CurrencyHistoryItem extends CurrencyConversionResult {
  id: string;
}

export type NewsArticleType = 'reported-facts' | 'claims' | 'analysis' | 'opinion';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  contentSnippet?: string;
  sourceName: string;
  sourceUrl: string;
  originalUrl: string;
  author?: string;
  publishedAt: number;
  category: 'world' | 'technology' | 'business' | 'environment' | 'health' | 'science';
  articleType: NewsArticleType;
  storyClusterId?: string;
}

export interface NewsCluster {
  id: string;
  topicTitle: string;
  articles: NewsArticle[];
}

export interface NewsSettings {
  enabled: boolean;
  enabledCategories: string[];
  hiddenSources: string[];
  refreshIntervalMinutes: number;
}

export interface ExplainSelectionPayload {
  text: string;
  tabId?: string;
  url?: string;
  title?: string;
}

export interface SendToNotesPayload {
  text: string;
  sourceUrl?: string;
  sourceTitle?: string;
}

// ==========================================
// NEXUS Markets Types
// ==========================================
export interface MarketsSettings {
  enabled: boolean; // false by default (hidden until enabled)
  enableStocks: boolean;
  enableIpos: boolean;
  enableMutualFunds: boolean;
  enableShopping: boolean;
  enableFinancialNews: boolean;
  notificationFrequency: 'realtime' | 'daily' | 'weekly' | 'disabled';
  enablePriceAlerts: boolean;
  defaultCurrency: string;
  refreshIntervalMinutes: number;
  hasMadeInitialChoice: boolean;
}

// Stocks
export interface StockCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type StockDataFreshness = 'realtime' | 'delayed' | 'historical';

export interface StockQuote {
  ticker: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
  volume?: number;
  marketCap?: number;
  peRatio?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  timestamp: number;
  dataFreshness: StockDataFreshness;
  delayMinutes?: number;
  provider: string;
  providerDisclaimer: string;
  officialWebsite?: string;
  investorRelationsUrl?: string;
  sector?: string;
  industry?: string;
  description?: string;
}

export interface StockWatchlistItem {
  ticker: string;
  name: string;
  exchange: string;
  addedAt: number;
  targetHighAlert?: number;
  targetLowAlert?: number;
  notes?: string;
}

export interface StockPriceAlert {
  id: string;
  ticker: string;
  targetPrice: number;
  direction: 'above' | 'below';
  createdAt: number;
  triggered: boolean;
  triggeredAt?: number;
}

// IPO Tracker
export type IpoStatus = 'upcoming' | 'open' | 'closed' | 'listed';

export interface IpoItem {
  id: string;
  companyName: string;
  symbol?: string;
  exchange: string;
  status: IpoStatus;
  openDate?: string;
  closeDate?: string;
  listingDate?: string;
  priceBandLow?: number;
  priceBandHigh?: number;
  currency: string;
  issueSize?: string;
  lotSize?: number;
  subscriptionQib?: number;
  subscriptionNii?: number;
  subscriptionRetail?: number;
  subscriptionTotal?: number;
  listingPrice?: number;
  isProvisional: boolean;
  provisionalNotes?: string;
  exchangeFilingUrl?: string;
  prospectusUrl?: string;
  provider: string;
  sourceVerifiedAt: number;
}

// Mutual Funds
export interface MutualFundNavPoint {
  date: string; // YYYY-MM-DD
  nav: number;
}

export interface MutualFundItem {
  id: string;
  schemeName: string;
  fundHouse: string;
  category: string;
  nav: number;
  navDate: string;
  previousNav?: number;
  change?: number;
  changePercent?: number;
  expenseRatio?: number;
  aum?: string;
  benchmark?: string;
  riskLevel?: 'Low' | 'Moderate' | 'Moderately High' | 'High' | 'Very High';
  manager?: string;
  navHistory: MutualFundNavPoint[];
  provider: string;
  lastUpdated: number;
}

export interface SipCalculationParams {
  monthlyAmount: number;
  durationYears: number;
  expectedAnnualReturnRate: number; // e.g. 12 for 12%
}

export interface SipCalculationResult {
  investedAmount: number;
  estimatedFutureValue: number;
  wealthGain: number;
  monthlyInvestment: number;
  durationYears: number;
  expectedRate: number;
  disclaimer: string;
}

export interface LumpSumCalculationParams {
  principalAmount: number;
  durationYears: number;
  expectedAnnualReturnRate: number;
}

export interface LumpSumCalculationResult {
  principalAmount: number;
  estimatedFutureValue: number;
  wealthGain: number;
  durationYears: number;
  expectedRate: number;
  disclaimer: string;
}

// Shopping Price Tracker
export interface ProductPricePoint {
  date: number;
  price: number;
  retailer: string;
  inStock: boolean;
  verified: boolean;
}

export interface TrackedProduct {
  id: string;
  title: string;
  url: string;
  retailer: string;
  category: string;
  targetPriceAlert?: number;
  currentPrice: number;
  currency: string;
  lowestPrice: number;
  highestPrice: number;
  dateAdded: number;
  lastChecked: number;
  inStock: boolean;
  priceHistory: ProductPricePoint[];
  notes?: string;
}

// Financial News
export type FinancialArticleType = 'filing' | 'reporting' | 'commentary' | 'opinion';

export interface FinancialNewsArticle {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  originalUrl: string;
  publishedAt: number;
  relatedTickers: string[];
  category: 'markets' | 'companies' | 'economy' | 'filings';
  articleType: FinancialArticleType;
}

export interface MarketsAlertPayload {
  type: 'stock' | 'shopping';
  title: string;
  message: string;
  data: any;
}

// ==========================================
// NEXUS Todo & Hub Types
// ==========================================
export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NexusTodo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: number;
  priority: TodoPriority;
  dueDate?: string; // YYYY-MM-DD
  category: string;
  associatedUrl?: string;
  associatedTitle?: string;
  createdAt: number;
  updatedAt: number;
}

export interface NexusTodoFilter {
  status?: 'all' | 'active' | 'completed';
  category?: string;
  priority?: TodoPriority;
  searchQuery?: string;
  sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'title';
}

export type HubCardId =
  | 'tools'
  | 'shortcuts'
  | 'bookmarks'
  | 'downloads'
  | 'todos'
  | 'notes'
  | 'watchlists';

export interface HubShortcut {
  id: string;
  title: string;
  url: string;
  icon?: string;
  category?: string;
}

export interface HubPreferences {
  cardOrder: HubCardId[];
  hiddenCards: HubCardId[];
  customShortcuts: HubShortcut[];
  recentTools: string[];
}

export interface NexusAPI {
  getVpnStatus: () => Promise<VpnStatus>;
  getVpnFreeLocations: () => Promise<VpnFreeLocation[]>;
  connectVpn: (countryCode: string) => Promise<VpnStatus>;
  disconnectVpn: () => Promise<VpnStatus>;

  // Tab Management
  createTab: (url?: string, workspaceId?: string, isPrivate?: boolean) => Promise<string>;
  createBackgroundTab: (url: string, workspaceId?: string) => Promise<string>;
  duplicateTab: (id: string) => Promise<string | null>;
  reopenClosedTab: () => Promise<string | null>;
  closeTab: (id: string) => Promise<void>;
  switchTab: (id: string) => Promise<void>;
  navigate: (id: string, url: string) => Promise<void>;
  goBack: (id: string) => Promise<void>;
  goForward: (id: string) => Promise<void>;
  reload: (id: string) => Promise<void>;
  stop: (id: string) => Promise<void>;
  toggleDevTools: (id?: string) => Promise<void>;
  
  // Tab Controls & Grouping
  muteTab: (id: string) => Promise<boolean>;
  pinTab: (id: string) => Promise<boolean>;
  setTabGroup: (id: string, groupId?: string) => Promise<void>;
  reorderTabs: (orderedIds: string[]) => Promise<void>;
  moveTabToWorkspace: (id: string, workspaceId: string) => Promise<void>;

  // Workspaces & Sessions
  switchWorkspace: (workspaceId: string, tabId?: string) => Promise<void>;
  saveSession: (data: SavedSessionData) => Promise<void>;
  restoreSession: () => Promise<SavedSessionData | null>;
  clearSession: () => Promise<void>;
  
  // Layout Bounds & Modal Visibility
  updateContentBounds: (bounds: ContentBounds) => Promise<void>;
  setModalOpen: (isOpen: boolean) => Promise<void>;

  // Zoom & Storage
  setZoomLevel: (level: number) => Promise<number>;
  getZoomLevel: () => Promise<number>;
  clearBrowsingData: () => Promise<void>;
  clearBrowsingDataDetailed: (options: ClearDataOptions) => Promise<void>;
  getSystemInfo: () => Promise<SystemInfo>;

  // Window Controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isWindowMaximized: () => Promise<boolean>;

  // Extensions Management
  selectExtensionDirectory: () => Promise<string | null>;
  validateExtension: (folderPath: string) => Promise<ExtensionValidationResult>;
  installExtension: (folderPath: string) => Promise<InstalledExtension>;
  uninstallExtension: (extensionId: string) => Promise<boolean>;
  toggleExtension: (extensionId: string, enabled: boolean) => Promise<boolean>;
  reloadExtension: (extensionId: string) => Promise<boolean>;
  getInstalledExtensions: () => Promise<InstalledExtension[]>;
  openExtensionPopup: (extensionId: string) => Promise<void>;

  // Bookmarks Management
  getBookmarks: () => Promise<BookmarkItem[]>;
  saveBookmark: (item: { id?: string; title: string; url?: string; favicon?: string; parentId?: string | null; type?: 'bookmark' | 'folder' }) => Promise<BookmarkItem>;
  createBookmarkFolder: (title: string, parentId?: string | null) => Promise<BookmarkItem>;
  removeBookmark: (id: string) => Promise<boolean>;
  exportBookmarksHtml: () => Promise<string>;
  importBookmarksHtml: (htmlContent: string) => Promise<{ imported: number }>;

  // History Management
  getHistory: (limit?: number) => Promise<HistoryEntry[]>;
  searchHistory: (query: string, limit?: number) => Promise<HistoryEntry[]>;
  deleteHistoryEntry: (id: string) => Promise<boolean>;
  deleteHistoryRange: (startTime: number, endTime: number) => Promise<number>;
  clearAllHistory: () => Promise<boolean>;

  // Downloads Management
  getDownloads: () => Promise<DownloadRecord[]>;
  pauseDownload: (id: string) => Promise<boolean>;
  resumeDownload: (id: string) => Promise<boolean>;
  cancelDownload: (id: string) => Promise<boolean>;
  openDownloadFile: (id: string) => Promise<boolean>;
  showDownloadInFolder: (id: string) => Promise<boolean>;
  getDownloadDirectory: () => Promise<string>;
  setDownloadDirectory: () => Promise<string | null>;
  clearDownloadsList: () => Promise<void>;
  removeDownloadEntry: (id: string) => Promise<boolean>;

  // Profiles Management
  getProfiles: () => Promise<UserProfile[]>;
  getActiveProfile: () => Promise<UserProfile>;
  createProfile: (name: string, icon: string, color: string) => Promise<UserProfile>;
  updateProfile: (id: string, updates: Partial<Pick<UserProfile, 'name' | 'icon' | 'color'>>) => Promise<UserProfile | null>;
  deleteProfile: (id: string) => Promise<boolean>;
  switchProfile: (id: string) => Promise<boolean>;

  // Site Permissions & Content Settings
  getSitePermissions: () => Promise<SitePermissionRule[]>;
  setSitePermission: (origin: string, permission: PermissionType, decision: PermissionDecision) => Promise<SitePermissionRule>;
  removeSitePermission: (origin: string, permission: PermissionType) => Promise<boolean>;
  clearAllSitePermissions: () => Promise<boolean>;
  respondPermissionPrompt: (requestId: string, allow: boolean, remember: boolean) => Promise<void>;

  // Security & Certificates
  getSiteSecurityInfo: (url: string) => Promise<SiteSecurityInfo>;

  // Tracking Protection
  getTrackingSettings: () => Promise<TrackingProtectionSettings>;
  setTrackingMode: (mode: TrackingProtectionMode) => Promise<void>;
  toggleTrackingException: (origin: string) => Promise<boolean>;

  // Developer Tools
  inspectElement: (tabId?: string) => Promise<void>;
  getPageInfo: (tabId?: string) => Promise<PageInfoDetails | null>;
  setDeviceEmulation: (tabId: string, preset: DevicePreset | null) => Promise<void>;
  viewPageSource: (tabId?: string) => Promise<void>;
  getCookiesForTab: (tabId?: string) => Promise<CookieItem[]>;
  removeCookie: (url: string, name: string) => Promise<boolean>;
  getStorageForTab: (tabId?: string) => Promise<StorageData>;
  clearStorageForTab: (tabId?: string, type?: 'all' | 'localStorage' | 'sessionStorage') => Promise<boolean>;
  getNetworkLogs: (tabId?: string) => Promise<NetworkLogEntry[]>;
  clearNetworkLogs: (tabId?: string) => Promise<void>;
  extractReaderMode: (tabId?: string) => Promise<ReaderResult>;
  getSiteZoom: (origin: string) => Promise<number>;
  setSiteZoom: (origin: string, zoomFactor: number) => Promise<void>;
  getAllSiteZooms: () => Promise<SiteZoomPreference[]>;

  // Mode Management & Performance Optimizations
  setBrowserMode: (mode: NexusBrowserMode) => Promise<void>;
  getBrowserMode: () => Promise<NexusBrowserMode>;
  getModeTelemetry: () => Promise<ModeTelemetry>;
  suspendTab: (tabId: string) => Promise<boolean>;
  wakeTab: (tabId: string) => Promise<boolean>;
  optimizeMemory: () => Promise<{ freedMemoryMB: number; suspendedCount: number }>;
  getModeConfig: () => Promise<ModeBehaviorConfig | undefined>;
  updateModeConfig: (config: Partial<ModeBehaviorConfig>) => Promise<ModeBehaviorConfig | undefined>;
  restoreModeDefaults: () => Promise<ModeBehaviorConfig | undefined>;

  // NEXUS Shield
  getShieldSettings: () => Promise<NexusShieldSettings>;
  updateShieldSettings: (settings: Partial<NexusShieldSettings>) => Promise<NexusShieldSettings>;
  getShieldStats: () => Promise<NexusShieldStats>;
  getTabShieldStats: (tabId?: string) => Promise<TabShieldStats>;
  toggleShieldSite: (origin: string) => Promise<boolean>;
  pauseShieldTemporarily: (durationMinutes: number) => Promise<number>;
  resumeShield: () => Promise<void>;
  updateShieldFilterLists: () => Promise<{ success: boolean; updatedCount: number; errors: string[] }>;
  resetShieldStats: () => Promise<void>;
  allowThreatBypass: (originOrUrl: string) => Promise<void>;

  // NEXUS Notes Management
  getNotes: (filter?: NotesFilterOptions) => Promise<NexusNote[]>;
  getNote: (id: string) => Promise<NexusNote | null>;
  saveNote: (note: Partial<NexusNote> & { title: string }) => Promise<NexusNote>;
  deleteNote: (id: string, permanent?: boolean) => Promise<boolean>;
  restoreNote: (id: string) => Promise<boolean>;
  purgeNote: (id: string) => Promise<boolean>;
  emptyTrash: () => Promise<boolean>;
  duplicateNote: (id: string) => Promise<NexusNote | null>;
  getNotebooks: () => Promise<NexusNotebook[]>;
  saveNotebook: (notebook: Partial<NexusNotebook> & { name: string }) => Promise<NexusNotebook>;
  deleteNotebook: (id: string) => Promise<boolean>;
  getFolders: (notebookId?: string) => Promise<NexusFolder[]>;
  saveFolder: (folder: Partial<NexusFolder> & { name: string; notebookId: string }) => Promise<NexusFolder>;
  deleteFolder: (id: string) => Promise<boolean>;
  getDraftRecovery: (noteId: string) => Promise<NexusDraftRecovery | null>;
  saveDraftRecovery: (draft: NexusDraftRecovery) => Promise<void>;
  clearDraftRecovery: (noteId: string) => Promise<void>;
  exportNotePdf: (noteId: string, options?: NotesExportOptions) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  exportNotebookPdf: (notebookId: string, options?: NotesExportOptions) => Promise<{ success: boolean; filePath?: string; error?: string }>;

  // NEXUS Intelligence Management
  lookupDictionary: (word: string) => Promise<DictionaryWordResult>;
  explainSelection: (text: string, readingLevel?: IntelligenceReadingLevel, targetLanguage?: string) => Promise<ContextualExplanation>;
  getVocabulary: () => Promise<VocabularyItem[]>;
  saveVocabularyItem: (item: Omit<VocabularyItem, 'id' | 'dateAdded'> & { id?: string }) => Promise<VocabularyItem>;
  deleteVocabularyItem: (id: string) => Promise<boolean>;
  getCurrencyRates: (base?: string) => Promise<CurrencyRateData>;
  convertCurrency: (req: CurrencyConversionRequest) => Promise<CurrencyConversionResult>;
  getCurrencyHistory: () => Promise<CurrencyHistoryItem[]>;
  clearCurrencyHistory: () => Promise<void>;
  getNewsSettings: () => Promise<NewsSettings>;
  updateNewsSettings: (settings: Partial<NewsSettings>) => Promise<NewsSettings>;
  getNewsFeed: (forceRefresh?: boolean) => Promise<{ articles: NewsArticle[]; clusters: NewsCluster[]; lastUpdated: number }>;

  // NEXUS Markets Management
  getMarketsSettings: () => Promise<MarketsSettings>;
  updateMarketsSettings: (settings: Partial<MarketsSettings>) => Promise<MarketsSettings>;
  searchStocks: (query: string) => Promise<StockQuote[]>;
  getStockQuote: (ticker: string) => Promise<StockQuote | null>;
  getStockCandles: (ticker: string, range?: string) => Promise<StockCandle[]>;
  getStockWatchlist: () => Promise<StockWatchlistItem[]>;
  addStockToWatchlist: (item: Omit<StockWatchlistItem, 'addedAt'>) => Promise<StockWatchlistItem>;
  removeStockFromWatchlist: (ticker: string) => Promise<boolean>;
  getIpos: (status?: IpoStatus) => Promise<IpoItem[]>;
  getMutualFunds: (category?: string) => Promise<MutualFundItem[]>;
  getMutualFundDetail: (id: string) => Promise<MutualFundItem | null>;
  calculateSip: (params: SipCalculationParams) => Promise<SipCalculationResult>;
  calculateLumpSum: (params: LumpSumCalculationParams) => Promise<LumpSumCalculationResult>;
  getTrackedProducts: () => Promise<TrackedProduct[]>;
  saveTrackedProduct: (product: Omit<TrackedProduct, 'id' | 'dateAdded' | 'lastChecked' | 'lowestPrice' | 'highestPrice' | 'priceHistory'> & { id?: string; initialPrice?: number }) => Promise<TrackedProduct>;
  recordProductPricePoint: (productId: string, price: number, inStock?: boolean) => Promise<TrackedProduct>;
  deleteTrackedProduct: (id: string) => Promise<boolean>;
  getFinancialNews: (ticker?: string, category?: string) => Promise<FinancialNewsArticle[]>;

  // NEXUS Todo Management
  getTodos: (filter?: NexusTodoFilter) => Promise<NexusTodo[]>;
  saveTodo: (todo: Partial<NexusTodo> & { title: string }) => Promise<NexusTodo>;
  deleteTodo: (id: string) => Promise<boolean>;
  toggleTodo: (id: string, completed?: boolean) => Promise<NexusTodo | null>;
  clearCompletedTodos: () => Promise<number>;

  // NEXUS Hub Management
  getHubPreferences: () => Promise<HubPreferences>;
  updateHubPreferences: (prefs: Partial<HubPreferences>) => Promise<HubPreferences>;
  recordToolUsage: (toolId: string) => Promise<void>;

  // Event Listeners
  onTabsUpdated: (callback: (tabs: TabState[], activeTabId: string) => void) => () => void;
  onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
  onExtensionsUpdated: (callback: (extensions: InstalledExtension[]) => void) => () => void;
  onBookmarksUpdated: (callback: (bookmarks: BookmarkItem[]) => void) => () => void;
  onHistoryUpdated: (callback: (history: HistoryEntry[]) => void) => () => void;
  onDownloadsUpdated: (callback: (downloads: DownloadRecord[]) => void) => () => void;
  onProfileSwitched: (callback: (profile: UserProfile) => void) => () => void;
  onPermissionPrompt: (callback: (prompt: PermissionPromptRequest) => void) => () => void;
  onTrackingStatsUpdated: (callback: (stats: { totalBlocked: number }) => void) => () => void;
  onShieldStatsUpdated: (callback: (stats: NexusShieldStats) => void) => () => void;
  onTabShieldStatsUpdated: (callback: (tabStats: TabShieldStats) => void) => () => void;
  onShieldPopupBlocked: (callback: (data: { tabId: string; url: string; origin: string }) => void) => () => void;
  onNetworkActivity: (callback: (entry: NetworkLogEntry) => void) => () => void;
  onModeChanged: (callback: (mode: NexusBrowserMode) => void) => () => void;
  onTelemetryUpdated: (callback: (telemetry: ModeTelemetry) => void) => () => void;
  onNotesUpdated: (callback: () => void) => () => void;
  onExplainSelectionRequested: (callback: (data: ExplainSelectionPayload) => void) => () => void;
  onSendToNotesRequested: (callback: (data: SendToNotesPayload) => void) => () => void;
  onMarketsAlertTriggered: (callback: (payload: MarketsAlertPayload) => void) => () => void;
  onTodosUpdated: (callback: (todos: NexusTodo[]) => void) => () => void;
}

export interface VpnStatus {
  available: boolean;
  connected: boolean;
  loggedIn: boolean;
  location?: string;
  message?: string;
}

export interface VpnFreeLocation {
  code: string;
  country: string;
  region: string;
}

declare global {
  interface Window {
    nexusAPI: NexusAPI;
  }
}

