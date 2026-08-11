# Implementation Plan - Visual Upgrade Unit Testing & Coverage

This plan outlines the setup of a robust testing framework and the creation of unit tests to ensure at least 90% coverage of the code written during the visual upgrade.

## User Review Required

> [!IMPORTANT]
> The codebase currently contains no testing infrastructure. We will install Jest, `jest-expo`, and React Native Testing Library. Adding these dependencies is necessary to run unit tests and collect coverage reports.

---

## Proposed Changes

### 1. Project Dependencies (Testing Framework Setup)
*   Install testing dependencies:
    *   `jest`
    *   `jest-expo` (official testing framework for Expo apps)
    *   `@testing-library/react-native` (standard React Native element querying and action simulation)
    *   `react-test-renderer` (required by testing-library)
*   Configure Jest in `package.json` or create a new `jest.config.js`.
*   Add a test run script in `package.json`: `"test": "jest --watchAll=false"`, and `"test:coverage": "jest --coverage"`.

### 2. Unit Tests for Visual Upgrade Modules
We will create test files under a unified test folder structure or next to components. Since these are React components and helper utilities, we will write:

#### [NEW] [tv-utils.test.ts](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/utils/__tests__/tv-utils.test.ts)
*   Test `getFontSize` scaling caps (e.g., inputting 24px caps at 28px on TV, behaves normally on mobile).
*   Test `isTVDevice`, `isGoogleTV`, and other helper functions under mocked platform settings.

#### [NEW] [TVFocusable.test.tsx](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/components/__tests__/TVFocusable.test.tsx)
*   Test that the component renders its children correctly.
*   Mock remote focus/blur handlers and verify that `Animated.Value` updates dynamically.
*   Verify that glow styles are applied when focused.

#### [NEW] [TVTabSidebar.test.tsx](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/components/__tests__/TVTabSidebar.test.tsx)
*   Test navigation emission events when clicking sidebar icons.
*   Test that focus triggers the expand animation (`toValue: 220`) and blur triggers collapse.

#### [NEW] [ChannelCard.test.tsx](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/components/__tests__/ChannelCard.test.tsx)
*   Verify 16:9 widescreen layout rendering on TV vs mobile.
*   Ensure favoriting icons render correctly based on store parameters.

#### [NEW] [colors.test.ts](file:///c:/Users/ashus/OneDrive/Documents/Code/iptv/constants/__tests__/colors.test.ts)
*   Test that cinematic theme colors and dark colors have proper fallback options.

---

## Verification Plan

### Automated Tests
*   Run the test command:
    ```bash
    npm run test:coverage
    ```
*   Confirm that the test coverage output for the changed files reaches >= 90%.
