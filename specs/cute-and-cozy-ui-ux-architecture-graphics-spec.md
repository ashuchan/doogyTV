# DoggyTV: "Cute & Cozy" UI/UX, Architecture & Graphics Specification

## Comprehensive Technical Specification & Implementation Roadmap

### 1. Executive Summary & Design Philosophy
This specification details the end-to-end technical, visual, and architectural overhaul of doggyTV, an IPTV streaming player targeting television devices (Android TV, Google TV, Fire TV), mobile, and web. The objective is to replace the cold cyber-cyan aesthetic with a warm, cute, living-room cartoon aesthetic inspired by the doggyTV mascot artwork (featuring a puppy, cat, and kitten watching television together).

The overhaul balances cuteness with technical rigor: it incorporates low-overhead GPU rendering safeguards for budget TV hardware (e.g., Fire TV Stick, Amlogic chipsets), enforces WCAG 2.1 AAA contrast compliance for 10-foot viewing distances, provides spatial exit-point memory for D-pad navigation, and preserves high automated test coverage (≥ 90%).

---

### 2. Design Tokens & 10-Foot Accessibility Palette
All tokens are defined in `constants/colors.ts` and `utils/tv-utils.ts`. Cold neon cyan (`#06B6D4`) and slate backgrounds are replaced with warm midnight charcoals, honey gold, and coral tones.

| Token Key | Legacy Value | New Value | Semantic Purpose | Contrast Ratio (vs #12131C) |
| :--- | :--- | :--- | :--- | :--- |
| `colors.background` | `#090D16` | `#12131C` | Deep Midnight Charcoal (Canvas Backdrop) | Base (1:1) |
| `colors.surface` / `card` | `#1E293B` | `#1E1F2E` | Warm Slate Panel (Cards, Drawers, Sidebar) | 1.2:1 (Surface layer) |
| `colors.primary` | `#06B6D4` | `#FFB338` | Puppy Honey Gold (Focus borders, brand accents) | 10.1:1 (AAA High Contrast) |
| `colors.focus` | `#06B6D4` | `#FFB338` | Active D-Pad Remote Focus Ring / Highlight | 10.1:1 (AAA High Contrast) |
| `colors.accent` | `#38BDF8` | `#FF7582` | Kitten Coral / Peach (Favorites, Live Badges) | 8.4:1 (AAA High Contrast) |
| `colors.text` | `#F8FAFC` | `#FFF8F0` | Warm Milk White (Primary TV typography) | 17.2:1 (AAA High Contrast) |
| `colors.textInverted` | None | `#12131C` | Dark Charcoal (Mandatory text on Gold/Coral badges) | 10.1:1 (AAA High Contrast) |
| `colors.textMuted` / `textSecondary` | `#94A3B8` | `#A59E98` | Warm Biscuit Gray (EPG subtitles, timeline meta) | 6.2:1 (AA Contrast) |

> **Critical Inversion Guardrail**: Rendering Milk White (`#FFF8F0`) text directly on Puppy Honey Gold (`#FFB338`) drops contrast to an unreadable 1.7:1. Any button, chip, or tag utilizing `#FFB338` or `#FF7582` as a background must enforce `colors.textInverted` (`#12131C`) to satisfy 10-foot viewing readability.

---

### 3. Spatial Navigation & Layout Engineering

#### 3.1 Collapsible Sidebar with Spatial Exit-Point Cache (`components/TVTabSidebar.tsx`)
- **Absolute Layering & Elevation**: The sidebar expands from 70px to 220px on D-pad remote focus as an absolute overlay. This ensures that the adjacent content container remains static with `paddingLeft: 70`, eliminating any layout reflow or cell re-measurement of the channel flatlist.
- **Backdrop Scrim**: An animated scrim (`backgroundColor: 'rgba(18, 19, 28, 0.65)'`, fade duration 180ms) dims background poster cards when the sidebar opens, preventing visual competition.
- **Spatial Exit-Point Memory**: Whenever focus leaves the channel grid, the active card ID is persisted in Zustand (`lastFocusedCardKey`). Pressing RIGHT on the remote from any vertical sidebar tab immediately restores focus to that exact card, preventing disorienting resets to row 0, column 0.

#### 3.2 Navigation Iconography Metaphors
To prevent ambiguity at low resolutions and 10-foot viewing distances, icons combine structural utility silhouettes with cute pet-themed styling:
- **Header Mascot**: Embedded badge featuring the puppy and kitten faces at the top of the rail.
- **Home**: Doghouse silhouette with a softly illuminated entryway.
- **Favorites**: Paw print badge with an integrated Kitten Coral center heart (`#FF7582`).
- **Channels / TV Guide**: Vintage television set with playful puppy-ear antennas.
- **Playlists**: Stacked playlist folder adorned with a mini-bone corner emblem (avoiding standalone bone icons that can be confused with audio mute).
- **Settings**: Rounded mechanical cog with a subtle pet-collar tag accent.

---

### 4. Graphics Performance & Focus Physics

#### 4.1 Low-Overhead Focus Physics (`components/TVFocusable.tsx`)
- **Hardware-Accelerated Scale Spring**: Clamped from 1.0 to 1.05 (preventing card overlap in 6-column grids) executed with native drivers:
  ```typescript
  Animated.spring(scaleAnim, {
    toValue: focused ? 1.05 : 1.0,
    friction: 7,
    tension: 100,
    useNativeDriver: true,
  }).start();
  ```
- **Zero-Blur Single-Pass Focus Stroke**: Dynamic native blurs (`shadowRadius: 16`, `elevation: 8`) are eliminated to prevent GPU fillrate stalls on low-end TV sticks. Instead, a clean hardware stroke is used:
  ```typescript
  export const tvFocusStroke = {
    borderWidth: 2.5,
    borderColor: '#FFB338',
  };
  ```
- **Offscreen Clipping Guard (`components/ChannelCard.tsx`)**: Cards use `borderRadius: 16` on an inner media container while the outer container handles scale transforms and focus strokes, avoiding expensive per-frame offscreen surface clipping.
- **Logo Fallbacks**: When a channel logo URL is broken or missing, render a warm pastel placeholder featuring a vector silhouette of the puppy or kitten.

---

### 5. Media Playback HUD, Buffering & Persona Boundaries

#### 5.1 Media Buffering & Splash Sequences
- **Lightweight Looping Animation**: Replace platform spinners with a hardware-decoded animated WebP or 30 fps canvas sprite ($120 \times 120$ px max) showing the puppy chasing its tail, eliminating JavaScript thread overhead.
- **Splash Handshake**: The video intro splash (kitten running to the puppy to watch TV) mounts in a detached native layer that unmounts immediately upon the first frame of the home UI rendering.
- **Splash Screen "Skip" Affordance**: Pressing OK, BACK, or any D-pad direction immediately aborts the splash animation and mounts the home UI, giving control back to the user instantly.

#### 5.2 Microcopy Guardrails (Cute vs. Functional)
| Category | Permitted Scope | Approved Copy Guidelines |
| :--- | :--- | :--- |
| **Emotional Surfaces** | Empty states, 404 stream errors, onboarding screens | • No search results: *"Ruff day! No channels found."*<br>• No playlists: *"Paws and relax! Add an M3U playlist to start watching."*<br>• Stream error: *"Cat got the signal? Channel temporarily unavailable."* |
| **High-Frequency Utility** | Player HUD, tooltips, settings, audio/subtitle pickers | Strictly concise and functional. Use standard technical terms (e.g., "Audio: Track 1", "Subtitles: English", "Buffer: 5s", "1080p", "Update Frequency"). |

#### 5.3 Empty State Recovery Actions
- Ensure every empty state includes a clear, focusable recovery button directly beneath the text (e.g., `[ Go to Settings ]`, `[ Add Playlist ]`).

#### 5.4 Player HUD & Auto-Dismiss Rules (`app/player.tsx`)
- **Vertical Linear Gradient Ramp**: Bottom playback controls render over a non-blocking linear gradient (from transparent at top to `rgba(18, 19, 28, 0.94)` at baseline) via `expo-linear-gradient`.
- **Inactivity Dismissal (4.5s)**: The HUD automatically dismisses after 4.5 seconds of D-pad inactivity. Any remote input resets the timer.
- **Remote Back Key**: Pressing BACK while the HUD or side-zapping drawer is open immediately clears the overlay without interrupting playback.
- **Player HUD Focus Trapping**: When a user presses OK or UP to wake the HUD, the focus instantly snaps to the primary action (e.g., Play/Pause toggle or EPG Timeline).

---

### 6. Implementation & Verification Plan

#### 6.1 Execution Phases
1. **Phase 1: Design Tokens & Geometry**: Update `constants/colors.ts` and `utils/tv-utils.ts` with the palette, contrast ratios, and zero-blur focus stroke definitions.
2. **Phase 2: Focus & Navigation**: Implement spring scale physics in `TVFocusable.tsx` and absolute-layered sidebar with exit-point memory in `TVTabSidebar.tsx` and `store/tv-navigation-store.ts`.
3. **Phase 3: Component Visuals**: Refactor `ChannelCard.tsx` squircle borders and fallback avatars; create `CuteEmptyState.tsx` and `CuteLoadingIndicator.tsx`.
4. **Phase 4: Player HUD**: Update `app/player.tsx` with vertical gradient overlay, 4.5s auto-dismiss logic, and focus trapping.
5. **Phase 5: Splash Screen & Onboarding**: Implement splash skip affordance and cute onboarding visuals.
6. **Phase 6: Testing & Quality Assurance**: Maintain ≥ 90% statement/line test coverage with Jest and React Native Testing Library.
7. **Phase 7: Live Playlist Integration & Web Outline Resets**:
   - Integrate `https://iptv-org.github.io/iptv/index.m3u` as the default live stream playlist.
   - Implement web CORS proxy fallback and playlist ID preservation across refreshes in `utils/m3u-parser.ts`.
   - Add state rehydration fallback guard and `resetToDefaultPlaylist()` in `store/playlist-store.ts`.
   - Implement global web focus resets in `app/_layout.tsx` and `components/TVFocusable.tsx` to eliminate browser user-agent black rectangle outlines.

---

### 7. Verification Summary
- **Unit & Integration Tests**: 14 of 14 test suites passed (73 tests) with 0 regressions.
- **TypeScript Typecheck**: 0 errors across all routes and components.
- **Web & TV Navigation**: Verified live channel population, smooth spatial D-pad navigation, backdrop scrim fade, and clean Honey Gold squircle focus rings.

