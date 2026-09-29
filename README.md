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

## 🔒 Security Posture

- **Renderer Process**: Completely isolated (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`). No Node.js APIs or raw Electron `ipcRenderer` instances are accessible from web content.
- **Web Engine Views**: Websites render within sandboxed `WebContentsView` contexts. Popups and external links are intercepted using `setWindowOpenHandler` and spawned cleanly as managed NEXUS tabs.
- **IPC Dispatcher**: Channel access is restricted strictly to high-level actions (`navigate`, `createTab`, `switchTab`, `closeTab`, `toggleDevTools`, `windowControls`).
# Nexus-Browser
