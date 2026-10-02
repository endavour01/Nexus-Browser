# NEXUS Design System — Reusable UI Primitives

This directory contains the canonical atomic UI primitives for NEXUS Browser.

## Core Rule for Future Development
**ALL NEW NEXUS FEATURES MUST REUSE THIS SHARED UI SYSTEM.**

- Before creating a button → Use `<Button>`
- Before creating an icon-only button → Use `<IconButton>`
- Before creating a card / container → Use `<Card>`
- Before creating a text input → Use `<Input>`
- Before creating a search field → Use `<SearchInput>`
- Before creating a dropdown → Use `<Select>`
- Before creating a status pill or tag → Use `<Badge>`
- Before creating a workspace panel header → Use `<PanelHeader>`
- Before creating a dialog or popup modal → Use `<Modal>`
- Before creating segmented / sub-view navigation → Use `<Tabs>`

A feature may create a new component only when existing primitives genuinely cannot represent the required interaction.

---

## The Three NEXUS Visual Identities
All primitives are built on CSS variables that adapt dynamically to the active theme mode:

1. **Default Mode (`data-mode="default"`):**
   - Palette: Obsidian & Violet
   - Canvas: `#0B0D12` | Surface: `#12151D` | Accent: `#A78BFA`
2. **Balanced Mode (`data-mode="balanced"`):**
   - Palette: Metallic Gold & Black (Super Saiyan aesthetic)
   - Canvas: `#090909` | Surface: `#14120C` | Accent: `#F5C542`
3. **Performance Mode (`data-mode="performance"`):**
   - Palette: Redline Crimson & Carbon
   - Canvas: `#080809` | Surface: `#121214` | Accent: `#F02D43`

**DO NOT HARDCODE COLORS.** Always use `--nexus-*` or mode variables (`var(--nexus-accent-primary)`, `var(--nexus-bg-surface)`).

---

## Content Density & Hierarchy Guidelines
1. **Utility First:** Workspace panels (Notes, Todo, Markets, etc.) are productivity tools, not marketing landing pages. Do not introduce promotional paragraphs or marketing buzzwords into headers.
2. **Never Shrink for Volume:** Do not use 9px or 10px text simply to cram more words into a tight layout. Keep text readable (minimum 11px for metadata, 12px for secondary, 13px for body).
3. **Intentional Spacing:** Unrelated controls must NEVER touch. Use `--nexus-space-*` tokens.
4. **Resets:** Buttons and inputs have universal resets to prevent Chromium user-agent `buttonface` (white/gray) rendering. Always use the canonical primitives.
