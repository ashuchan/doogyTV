---
name: iptv-onboarding
description: >-
  Use this skill when onboarding developers to the doggyTV codebase, setting up local development environment, understanding application architecture, working with Zustand state stores, extending TV focus management, or troubleshooting local run scripts.
---

# doggyTV - Developer Onboarding Guide

Welcome to the **doggyTV** codebase! This skill serves as an interactive runbook and guide for developers onboarding to the project.

---

## 1. Quick Start & Running Locally

To run the application locally without relying on remote network tunnels or external services:

### Step 1: Check Environment Prerequisites
Ensure Node.js v18+ is installed. Execute the environment verification helper script:
```bash
node .agents/skills/iptv-onboarding/scripts/check-env.js
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Launch Local Development Server

- **Web Browser (Recommended for quick testing & development)**:
  ```bash
  npm run web
  ```
  This launches Expo Web on `http://localhost:8081`.

- **Expo Dev Server (Mobile / Emulator / TV)**:
  ```bash
  npm start
  ```
  Then press:
  - `w` to open in Web Browser
  - `a` to open in Android Emulator
  - `i` to open in iOS Simulator

- **Tunnel Mode (Only if accessing from external networks)**:
  ```bash
  npm run start:tunnel
  ```

---

## 2. Architecture & Codebase Map

For a full technical overview, read the [Architecture Reference Guide](./references/architecture.md).

### Directory Overview

- **[`app/`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/app)**: Expo Router pages & navigation layouts.
  - [`app/(tabs)/`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/app/(tabs)): Main screens (`index.tsx`, `channels.tsx`, `favorites.tsx`, `search.tsx`, `settings.tsx`).
  - [`app/player.tsx`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/app/player.tsx): Video stream player component using Expo AV.
- **[`components/`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/components)**: UI components.
  - [`TVFocusable.tsx`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/components/TVFocusable.tsx): Focus wrapper for D-pad navigation on Android TV / Google TV / Apple TV.
  - [`ResponsiveLayout.tsx`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/components/ResponsiveLayout.tsx): Layout adapter for mobile, tablet, and TV screen dimensions.
  - [`ChannelCard.tsx`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/components/ChannelCard.tsx), [`ChannelListItem.tsx`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/components/ChannelListItem.tsx): Channel rendering components.
- **[`store/`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/store)**: Zustand persistent state stores.
  - [`playlist-store.ts`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/store/playlist-store.ts): Playlist array, M3U fetching, and refreshing.
  - [`favorites-store.ts`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/store/favorites-store.ts): Bookmarked channels state.
  - [`recently-watched-store.ts`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/store/recently-watched-store.ts): History log of played channels.
- **[`utils/`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/utils)**: Business logic utilities.
  - [`m3u-parser.ts`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/utils/m3u-parser.ts): M3U & M3U8 playlist format parser.
  - [`tv-utils.ts`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/utils/tv-utils.ts): Device detection and TV layout calculations.
  - [`background-fetch.ts`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/utils/background-fetch.ts): Periodic playlist sync tasks.
- **[`context/`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/context)**: React Context providers (`theme-context.tsx`).
- **[`types/`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/types)**: TypeScript interface definitions (`channel.ts`, `playlist.ts`).

---

## 3. Developer Extension Runbooks

### Runbook A: Adding a New Screen / Tab
1. Add a new file under `app/(tabs)/my-screen.tsx`.
2. Register the tab item in [`app/(tabs)/_layout.tsx`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/app/(tabs)/_layout.tsx) with icon and title.
3. Wrap interactive list elements in `TVFocusable` to ensure TV remote accessibility.

### Runbook B: Extending TV D-Pad Remote Support
When creating clickable UI elements (buttons, channel cards, list items):
1. Import `TVFocusable` from `@/components/TVFocusable`.
2. Wrap your component in `<TVFocusable onPress={...} focusedStyle={...}>`.
3. Provide directional navigation overrides if necessary: `nextFocusDown`, `nextFocusUp`, `nextFocusLeft`, `nextFocusRight`.

### Runbook C: Modifying State Management
To add state parameters or actions:
1. Update interface definitions in [`types/channel.ts`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/types/channel.ts) or [`types/playlist.ts`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/types/playlist.ts).
2. Modify the corresponding store in [`store/`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/store).
3. If new fields need persistence across app launches, ensure Zustand `persist` middleware includes them.

---

## 4. Verification & Quality Checks

Run the following commands to verify code health before committing:

```bash
# 1. Typecheck TypeScript files
npm run typecheck

# 2. Test local web build start
npm run web
```

---

## 5. Common Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `Tunnel error` or Ngrok login prompt | Executing `--tunnel` without Ngrok account | Use `npm start` or `npm run web` for standard local execution. |
| M3U playlist fails to load on Web | Browser CORS restrictions on external M3U domain | Test on Android/iOS emulator or use a CORS proxy / sample local M3U file. |
| TV D-Pad focus not showing | Missing `TVFocusable` wrapper | Wrap the element in `TVFocusable` and ensure `isTVDevice()` returns true. |
| Metro bundler cache stale | Outdated asset cache | Run `npx expo start -c` to clear Metro cache. |
