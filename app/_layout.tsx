import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useRef } from "react";
import { Platform, View, Text, StyleSheet, Pressable } from "react-native";
import { Video, ResizeMode } from "expo-av";
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

const introVideoAsset = require("../assets/intro.mp4");

export default function RootLayout() {
  console.log("[DOGGYTV] Rendering RootLayout component...");
  const [showIntro, setShowIntro] = useState(true);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    setupBackgroundFetch();
    if (Platform.OS !== "web") {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  const finishIntro = () => {
    setShowIntro(false);
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <View style={{ flex: 1, minHeight: "100vh" as any, backgroundColor: "#0f172a" }}>
          {showIntro ? (
            <Pressable style={styles.introContainer} onPress={finishIntro}>
              {Platform.OS === "web" ? (
                <video
                  src={introVideoAsset}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onEnded={finishIntro}
                />
              ) : (
                <Video
                  ref={videoRef}
                  source={introVideoAsset}
                  style={StyleSheet.absoluteFill}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isMuted={false}
                  onPlaybackStatusUpdate={(status: any) => {
                    if (status.didJustFinish) {
                      finishIntro();
                    }
                  }}
                />
              )}
              <View style={styles.skipButton}>
                <Text style={styles.skipText}>Press anywhere to skip</Text>
              </View>
            </Pressable>
          ) : (
            <RootLayoutNav />
          )}
        </View>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  introContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  skipButton: {
    position: "absolute",
    bottom: 40,
    right: 40,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  skipText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

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