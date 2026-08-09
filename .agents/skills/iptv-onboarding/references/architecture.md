# Architecture & Technical Reference: doggyTV

This document details the architectural design, technical components, state management patterns, and device optimization strategies used in the doggyTV codebase.

---

## 1. Application Layer & Routing

The application uses **Expo Router v4** (file-based routing build on top of React Navigation v7).

```
app/
├── _layout.tsx                     # Root Stack layout (ThemeProvider, ErrorBoundary, Background Fetch init)
├── (tabs)/                         # Bottom tab navigator for main views
│   ├── _layout.tsx                 # Tab navigation configuration (Icons, Titles, Theme colors)
│   ├── index.tsx                   # Home tab: Recent playlists, Category browser, Channel grid
│   ├── channels.tsx                # Channels tab: Category filtering & multi-column grid
│   ├── favorites.tsx               # Favorites tab: User bookmarked channels
│   ├── search.tsx                  # Search tab: Live query filter across channels & categories
│   └── settings.tsx                # Settings tab: Playlist management, Update frequency, About
├── player.tsx                      # Fullscreen Video Player modal view (Expo AV)
├── modal.tsx                       # General modal view container
├── error-boundary.tsx              # Error fallback container for runtime errors
├── +not-found.tsx                  # 404 fallback screen
└── settings/                       # Sub-routes under Settings
    ├── add-playlist.tsx            # Form to add new M3U URL / playlist name
    ├── update-settings.tsx         # Configuration for auto-update interval
    └── about.tsx                   # Application info & credits
```

---

## 2. State Management Architecture

State is managed using **Zustand** stores with persistent storage provided by `@react-native-async-storage/async-storage`.

### Stores (`store/`)

1. **`playlist-store.ts` (`usePlaylistStore`)**:
   - Holds array of `Playlist` objects.
   - `addPlaylist(playlist)`: Appends new playlist.
   - `removePlaylist(id)`: Removes playlist by ID.
   - `fetchPlaylists(playlistId?)`: Fetches fresh M3U content over HTTP, parses `#EXTM3U` and `#EXTINF` metadata via `m3u-parser.ts`, updates state, and updates `lastUpdated` timestamp.
   - Persisted under key `"doggytv-playlists"`.

2. **`favorites-store.ts` (`useFavoritesStore`)**:
   - Holds array of favorite `Channel` objects.
   - `addFavorite(channel)`, `removeFavorite(channelId)`, `isFavorite(channelId)`.
   - Persisted under key `"doggytv-favorites"`.

3. **`recently-watched-store.ts` (`useRecentlyWatchedStore`)**:
   - Holds array of recently played `Channel` objects (capped at 20 items).
   - `addRecentlyWatched(channel)`, `clearRecentlyWatched()`.
   - Persisted under key `"doggytv-recently-watched"`.

---

## 3. M3U Playlist Parser Engine

Located in [`utils/m3u-parser.ts`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/utils/m3u-parser.ts):

- **Format Compliance**: Validates `#EXTM3U` header.
- **Metadata Extraction**:
  - Parses `#EXTINF:duration tvg-id="..." tvg-name="..." tvg-logo="..." group-title="...",Channel Name`.
  - Parses `#EXTGRP:` headers when present.
  - Defaults category to `"Uncategorized"` if missing.
- **Output Data Structure**: Returns structured `Playlist` containing `Channel[]`.

---

## 4. TV Remote Navigation & D-Pad Focus Engine

Smart IPTV Viewer provides first-class support for Android TV, Google TV, Apple TV, and web remote control inputs.

- **`utils/tv-utils.ts`**:
  - `isTVDevice()`: Detects TV OS target via `Platform.isTV`.
  - `isGoogleTV()`: Detects Google TV specifics.
  - `getTVItemWidth()`, `getTVGridColumns()`: Computes dynamic grid sizes optimized for TV viewing distances (10ft interface).
- **`components/TVFocusable.tsx`**:
  - Wrapper component extending `Pressable`.
  - Manages focus state (`isFocused`).
  - Applies high-visibility active outline border (`borderColor: '#4361ee'`, `borderWidth: 3`).
  - Supports focus directions (`nextFocusDown`, `nextFocusUp`, `nextFocusLeft`, `nextFocusRight`).
  - Handles `requestTVFocus()` for initial default element focus.

---

## 5. Media Streaming & Playback Engine

- Built using `expo-av` Video component ([`app/player.tsx`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/app/player.tsx)).
- Supports HLS (`.m3u8`), HTTP live streams, and standard MP4/AAC streams.
- Fullscreen controls, pause/play, volume adjustment, and error handling for broken stream URLs.

---

## 6. Background Sync & Periodic Updates

Located in [`utils/background-fetch.ts`](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/utils/background-fetch.ts):

- Uses `expo-background-fetch` and `expo-task-manager`.
- Periodically triggers `usePlaylistStore.getState().fetchPlaylists()` in background thread.
- Automatically refreshes channel lists based on user-configured refresh interval in settings.
