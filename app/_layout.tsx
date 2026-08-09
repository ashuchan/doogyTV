import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform, View, Text } from "react-native";
import { ErrorBoundary } from "./error-boundary";
import { ThemeProvider } from "@/context/theme-context";
import { setupBackgroundFetch } from "@/utils/background-fetch";

if (typeof global === "undefined") {
  (globalThis as any).global = globalThis;
}

if (typeof globalThis.setImmediate === "undefined") {
  (globalThis as any).setImmediate = (fn: (...args: any[]) => void, ...args: any[]) => setTimeout(() => fn(...args), 0);
  (globalThis as any).clearImmediate = (id: any) => clearTimeout(id);
}

if (typeof globalThis.URLSearchParams === "undefined") {
  class URLSearchParamsPolyfill {
    private params: [string, string][] = [];
    constructor(init?: any) {
      if (Array.isArray(init)) {
        this.params = init;
      }
    }
    get(name: string) { return (this.params.find(p => p[0] === name) || [])[1] || null; }
    getAll(name: string) { return this.params.filter(p => p[0] === name).map(p => p[1]); }
    has(name: string) { return this.params.some(p => p[0] === name); }
    set(name: string, value: string) { this.params.push([name, value]); }
    append(name: string, value: string) { this.params.push([name, value]); }
    delete(name: string) { this.params = this.params.filter(p => p[0] !== name); }
    toString() { return this.params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&'); }
  }
  (globalThis as any).URLSearchParams = URLSearchParamsPolyfill;
}

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  console.log("[DOGGYTV] Rendering RootLayout component...");

  useEffect(() => {
    setupBackgroundFetch();
    if (Platform.OS !== "web") {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <View style={{ flex: 1, minHeight: "100vh" as any, backgroundColor: "#0f172a" }}>
          <RootLayoutNav />
        </View>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="player" options={{ headerShown: false, presentation: "fullScreenModal" }} />
      <Stack.Screen name="settings/add-playlist" options={{ title: "Add Playlist" }} />
      <Stack.Screen name="settings/about" options={{ title: "About" }} />
      <Stack.Screen name="settings/update-settings" options={{ title: "Update Settings" }} />
    </Stack>
  );
}