# ⚡ NEXUS Desktop Web Browser

> A minimal, premium, nerd-friendly desktop web browser designed for power users, developers, and tech enthusiasts.

Built with **Electron**, **React**, **Vite**, **TypeScript**, and modern **Electron WebContentsView**.

---

## 💎 Features & Highlights

- **Real Browsing Engine (`WebContentsView`)**: No iframes or fake mockups. Websites are rendered with native Chromium fidelity via isolated `WebContentsView` instances managed securely in the main process.
- **Premium Developer Aesthetic**: Obsidian & charcoal palette (`#0b0d11`, `#141721`), subtle violet accent (`#8b5cf6`), thin borders, and clean monospace typography (`JetBrains Mono`).
- **Power Omnibox**: Smart input that intelligently distinguishes URLs, local development ports (`localhost:3000`), IP addresses, and search queries (powered by DuckDuckGo). Includes SSL security indicator and one-click URL copy.
- **Built-in Web DevTools Inspector**: Inspect any live web page on the fly with Chrome DevTools via the toolbar button or `Ctrl+Shift+I`.
- **Keyboard-Centric Navigation**: Built for speed with full shortcut support (`Ctrl+T`, `Ctrl+W`, `Ctrl+R`, `Alt+Left/Right`, etc.).
- **NEXUS Command Center**: A sleek new-tab workspace with a digital clock, quick developer launcher tiles (GitHub, Hacker News, MDN, Stack Overflow), and a keybindings cheat sheet.
- **Security-First Architecture**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, and a minimal, typed IPC bridge.

---

## 🛠️ Architecture

```
nexus-browser/
├── src/
│   ├── main/
│   │   ├── index.ts          # Main process entry, frameless window, lifecycle & IPC handlers
│   │   └── tab-manager.ts    # WebContentsView multi-tab engine & bounds synchronization
│   ├── preload/
│   │   └── index.ts          # Safe contextBridge exposing window.nexusAPI
│   ├── renderer/
│   │   ├── index.html        # Entry HTML with CSP
│   │   └── src/
│   │       ├── components/
│   │       │   ├── TitleBar.tsx        # Frameless titlebar, tab strip, window controls
│   │       │   ├── NavigationBar.tsx   # History buttons, omnibox, DevTools trigger
│   │       │   └── NewTabWorkspace.tsx # Obsidian speed-dial / command center
│   │       ├── App.tsx       # Root React shell & global keyboard shortcuts
│   │       ├── main.tsx      # React DOM bootstrap
│   │       ├── index.css     # Base theme variables & dark styling
│   │       └── components.css # Component styles & animations
│   └── shared/
│       └── types.ts          # Strongly typed interfaces (TabState, NexusAPI, ContentBounds)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v20+ / v24+ recommended)
- **npm**: v9.0.0 or later

### 2. Install Dependencies
```bash
npm install
```

### 3. Run in Development Mode
Starts the Vite dev server for React hot reloading and launches Electron with live WebContentsView integration:
```bash
npm run dev
```

### 4. Build for Production
Compiles the React renderer with Vite and packages the Electron main and preload scripts with `esbuild`:
```bash
npm run build
```

### 5. Launch Production Build
```bash
npm start
```

---

## ⌨️ Power User Keybindings

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + T` | Open a new tab |
| `Ctrl + W` | Close the active tab |
| `Ctrl + R` / `F5` | Reload the active tab |
| `Ctrl + Shift + I` / `F12` | Toggle Chrome DevTools for the active web page |
| `Alt + ←` | Navigate back |
| `Alt + →` | Navigate forward |
| `Middle Click` | Close tab from tab bar |

---

## ⚡ Three-Mode System

NEXUS features an integrated Three-Mode Engine that provides distinct visual identities, tailored operational workflows, and verified system safeguards without disrupting open web pages or running downloads.

### 1. Default Mode — Obsidian & Violet
* **Visual Identity**: Original charcoal-and-violet aesthetic (`#0B0D12` background, `#12151D` surface, `#A78BFA` violet accent).
* **Behavior**: Preserves standard browser execution and all user preferences. Background tabs run unthrottled and no automatic resource suspension is enforced.
* **Default Out of the Box**: Configured as the default experience for all new installations.

### 2. Balanced Mode — Golden Focus & Productivity
* **Visual Identity**: Super Saiyan-inspired aesthetic featuring deep blacks and rich metallic gold accents (`#090909` background, `#14120C` surface, `#F5C542` primary gold, `#D4A72C` secondary gold, `#FFF8E5` warm typography).
* **Behavior**: Tailored for focus and extended browsing sessions. Features high-visibility golden keyboard focus rings (`2px solid #F5C542`), dedicated Focus Workspaces for research projects, and optional distraction reduction.
* **Safeguards**: Never blocks websites or suppresses notifications arbitrarily.

### 3. Performance Mode — Crimson Redline & Carbon
* **Visual Identity**: High-contrast carbon surfaces and vivid crimson accents (`#080809` background, `#121214` surface, `#F02D43` primary redline, `#A9152A` secondary crimson).
* **Behavior & Resource Conservation**:
  - **Zero-Latency Transitions**: Bypasses UI transition delays (`0.01ms`) for instant keyboard and mouse response.
  - **Background Tab Throttling**: Restricts background timer execution via Chromium `setBackgroundThrottling(true)`.
  - **Intelligent Inactivity Auto-Suspension**: Unloads inactive background `WebContentsView` processes after a configurable timeout (default 3 minutes), freeing ~85 MB of memory per tab.
* **Strict Safeguards**:
  - **Playing Audio**: Tabs playing media or audio are strictly protected from suspension.
  - **Active Downloads**: Tabs with in-progress file transfers are never discarded.
  - **Actively Loading Pages**: Tabs currently loading web resources are protected from interruption.
  - **Foreground Active Tab**: The current visible tab is always preserved.
* **Honest Telemetry**: Telemetry reports actual measured process memory (`process.memoryUsage().rss` and `heapUsed`) and explicitly distinguishes measured metrics from estimated renderer savings. No fake CPU overclocking or artificial benchmarks.

---

## 🛡️ NEXUS Shield — Privacy-Focused Ad & Threat Protection

NEXUS Shield is a privacy-first, network-level content filtering and website protection engine integrated directly into the browser core.

### Core Modules
1. **Network-Level Ad Blocking**:
   - High-throughput trie and suffix matching targeting known ad servers (DoubleClick, Google AdSense/Syndication, AppNexus, Criteo, CarbonAds, etc.) and ad path heuristics.
   - Built-in support for established filter lists (**EasyList**, **Peter Lowe's**, custom subscription URLs).
2. **Enhanced Tracking Protection**:
   - Stops behavioral profiling, fingerprinting, and analytics crawlers (Google Analytics, Facebook Pixel, Segment, Microsoft Clarity, Hotjar, etc.).
   - Standard and Strict protection modes configurable with one click.
3. **Malicious Destination & Phishing Defense**:
   - Intercepts navigations to known deceptive portals, crypto drainers, malware distribution hosts, and fake banking logins before page rendering starts.
   - High-contrast warning page at `nexus://warning` explaining the threat classification and providing safe return actions.
   - User-controlled override option ("Proceed Anyway (Unsafe)") with session-isolated bypass memory.
4. **Unsolicited Pop-up & Hijack Blocker**:
   - Intercepts unsolicited `window.open` requests and aggressive tab-under networks (PopAds, PopCash, etc.) without breaking user-initiated links.
5. **Download Safety Guard**:
   - Detects executable files (`.exe`, `.msi`, `.bat`, `.sh`, `.appimage`, `.vbs`, etc.) and warns before opening. Never auto-executes downloads.
6. **Strict SSL / TLS Enforcement**:
   - Strict certificate validation; invalid, expired, or self-signed certificates cannot be bypassed silently.
7. **Per-Site Allowlist & Temporary Pause**:
   - Quick one-click site toggle in the address bar popover.
   - Flexible temporary pause (15 min / 30 min / 1 hr) for testing.
8. **Shield Dashboard (`nexus://shield`)**:
   - Comprehensive control center displaying live blocked item telemetry, filter list management, allowlists, and browsing data sanitization.
9. **Technical Honesty & Local Privacy Guarantee**:
   - Filter list evaluations occur entirely on-device; full browsing history is never transmitted to cloud servers.
   - Honest security stance: clearly discloses that no tool can detect or prevent 100% of threats.

---

## 🎛️ Mode Controls & Accessibility

* **Toolbar Mode Switcher**: Fast-access toolbar trigger displaying distinctive icons (`Compass` for Default, `Sun` for Balanced, `Zap` for Performance) and a compact popover with live color swatches and active checkmarks.
* **Full Keyboard Accessibility**: ARIA-compliant `role="radiogroup"` / `role="radio"` navigation with Arrow cycling, `Enter`/`Space` selection, and `Escape` dismissal.
* **One-Click Reset**: "Restore Standard Behavior" instantly resets the browser mode, tab inactivity thresholds, and throttling back to standard defaults.

---

## 🧪 Verification & Testing Suite

NEXUS includes 13 automated test suites covering core engine operations, IPC security, tab lifecycle, visual tokens, mode integrations, and NEXUS Shield:

```bash
# Run the complete test suite (all 13 suites)
npm test

# Run dedicated NEXUS Shield Protection Suite (8 test suites)
npm run test:shield

# Run dedicated Three-Mode Integration QA (11 verification suites)
npm run test:modes-qa

# Run Modes Control Panel & Toolbar Switcher tests (14 check suites)
npm run test:control-panel

# Run Three-Mode Optimizer & Safeguards tests (22 verification checks)
npm run test:modes

# Run Runtime Visual Identity & Computed CSS verification
npm run test:visual

# Typecheck and build
npm run typecheck
npm run build
```

---

## 🔒 Security Posture

- **Renderer Process**: Completely isolated (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`). No Node.js APIs or raw Electron `ipcRenderer` instances are accessible from web content.
- **Web Engine Views**: Websites render within sandboxed `WebContentsView` contexts. Popups and external links are intercepted using `setWindowOpenHandler` and spawned cleanly as managed NEXUS tabs.
- **IPC Dispatcher**: Channel access is restricted strictly to high-level actions (`navigate`, `createTab`, `switchTab`, `closeTab`, `toggleDevTools`, `windowControls`, `modes:*`, `shield:*`).


