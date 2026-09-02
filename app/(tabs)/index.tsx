import React, { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { StyleSheet, View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Platform, Dimensions } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/theme-context";
import { usePlaylistStore } from "@/store/playlist-store";
import { useRecentlyWatchedStore } from "@/store/recently-watched-store";
import { CategoryList } from "@/components/CategoryList";
import { ChannelCard } from "@/components/ChannelCard";
import { PlaylistStatus } from "@/components/PlaylistStatus";
import { Footer } from "@/components/Footer";
import { isTVDevice, isLargeScreen, getFontSize, getSpacing, getGridColumns, isGoogleTV } from "@/utils/tv-utils";
import { TVFocusable } from "@/components/TVFocusable";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { useIsFocused } from "@react-navigation/native";
import { useSpatialNavigation, SpatialGridRow } from "@/hooks/useSpatialNavigation";

export default function HomeScreen() {
  console.log("[DOGGYTV] Rendering HomeScreen component...");
  const router = useRouter();
  const { colors } = useTheme();
  const { playlists, fetchPlaylists, loading, error } = usePlaylistStore();
  const { recentlyWatched } = useRecentlyWatchedStore();
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));
  const isScreenFocused = useIsFocused();
  const mainScrollViewRef = useRef<ScrollView | null>(null);
  
  const isTV = isTVDevice() || isGoogleTV();
  const isLarge = isLargeScreen();
  const isLandscape = dimensions.width > dimensions.height;

  const firstCardRef = useRef<any>(null);

  const safePlaylists = Array.isArray(playlists) ? playlists : [];
  const safeRecentlyWatched = Array.isArray(recentlyWatched) ? recentlyWatched : [];
  const allChannels = safePlaylists.flatMap(playlist => (Array.isArray(playlist?.channels) ? playlist.channels : []));
  const featuredChannels = allChannels.slice(0, (isTV || isLarge) ? 15 : 10);
  const categories = [...new Set(allChannels.map(channel => channel?.category).filter(Boolean))].slice(0, (isTV || isLarge) ? 8 : 5);

  const handleChannelPress = useCallback((channelId: string) => {
    router.push(`/player?id=${channelId}`);
  }, [router]);

  const hasContinueWatching = safeRecentlyWatched.length > 0;
  const continueWatchingChannels = useMemo(() => {
    return safeRecentlyWatched
      .map(channelId => allChannels.find(c => c.id === channelId))
      .filter(Boolean);
  }, [safeRecentlyWatched, allChannels]);

  // Construct spatial grid rows for keyboard and remote navigation
  const spatialRows: SpatialGridRow[] = useMemo(() => {
    const rows: SpatialGridRow[] = [];
    let currentRowIdx = 0;

    if (hasContinueWatching && continueWatchingChannels.length > 0) {
      rows.push({
        row: currentRowIdx,
        itemCount: continueWatchingChannels.length,
        onSelects: continueWatchingChannels.map(c => () => handleChannelPress(c!.id)),
      });
      currentRowIdx++;
    }

    if (featuredChannels.length > 0) {
      rows.push({
        row: currentRowIdx,
        itemCount: featuredChannels.length,
        onSelects: featuredChannels.map(c => () => handleChannelPress(c.id)),
      });
      currentRowIdx++;
    }

    categories.forEach((category) => {
      const catChannels = allChannels.filter(c => c.category === category).slice(0, (isTV || isLarge) ? 15 : 10);
      if (catChannels.length > 0) {
        rows.push({
          row: currentRowIdx,
          itemCount: catChannels.length,
          onSelects: catChannels.map(c => () => handleChannelPress(c.id)),
        });
        currentRowIdx++;
      }
    });

    return rows;
  }, [hasContinueWatching, continueWatchingChannels, featuredChannels, categories, allChannels, handleChannelPress, isTV, isLarge]);

  const { isItemFocused } = useSpatialNavigation({
    enabled: isScreenFocused,
    rows: spatialRows,
    scrollViewRef: mainScrollViewRef,
  });

  // Request focus on the first card when the screen gains focus on TV
  useEffect(() => {
    if (isScreenFocused && isTV) {
      const timer = setTimeout(() => {
        if (firstCardRef.current) {
          console.log("[DOGGYTV] Requesting focus on first card...");
          if (firstCardRef.current.requestTVFocus) {
            firstCardRef.current.requestTVFocus();
          } else if (firstCardRef.current.focus) {
            firstCardRef.current.focus();
          }
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isScreenFocused, isTV, loading, allChannels.length, safeRecentlyWatched.length]);

  // Listen for dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });
    
    return () => subscription.remove();
  }, []);

  const onRefresh = useCallback(async () => {
    await fetchPlaylists();
  }, [fetchPlaylists]);

  // Render retry button based on platform
  const renderRetryButton = () => {
    if (!error) return null;
    return (
      <TVFocusable
        isDefault={true}
        style={[
          styles.retryButton, 
          { backgroundColor: colors.primary }
        ]}
        focusedStyle={{ borderColor: colors.text }}
        onPress={onRefresh}
      >
        <Text style={[
          styles.retryButtonText, 
          { 
            color: colors.white,
            fontSize: isTV ? getFontSize(16) : 14
          }
        ]}>
          Retry
        </Text>
      </TVFocusable>
    );
  };

  const featuredRowIndex = hasContinueWatching ? 1 : 0;
  const firstCategoryRowIndex = hasContinueWatching ? 2 : 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ResponsiveLayout>
        <ScrollView
          ref={mainScrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            (isTV || isLarge) && { paddingHorizontal: getSpacing(32) },
            isTV && isLandscape && { paddingLeft: getSpacing(90) }
          ]}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          }
        >
          <PlaylistStatus />

          {loading && allChannels.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[
                styles.loadingText, 
                { 
                  color: colors.text,
                  fontSize: isTV ? getFontSize(18) : 16
                }
              ]}>
                Loading channels...
              </Text>
            </View>
          ) : error && allChannels.length === 0 ? (
            <View style={styles.errorContainer}>
              <Text style={[
                styles.errorText, 
                { 
                  color: colors.error,
                  fontSize: isTV ? getFontSize(18) : 16
                }
              ]}>
                {error}
              </Text>
              {renderRetryButton()}
            </View>
          ) : (
            <>
              {hasContinueWatching && (
                <View style={[styles.section, (isTV || isLarge) && { marginBottom: getSpacing(32) }]}>
                  <Text style={[
                    styles.sectionTitle, 
                    { 
                      color: colors.text,
                      fontSize: isTV ? getFontSize(24) : 20
                    }
                  ]}>
                    Continue Watching
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={[
                      styles.channelRow, 
                      (isTV || isLarge) && { gap: getSpacing(16) },
                      isTV && isLandscape && { paddingBottom: getSpacing(16) }
                    ]}>
                      {safeRecentlyWatched.map((channelId, index) => {
                        const channel = allChannels.find(c => c.id === channelId);
                        if (!channel) return null;
                        return (
                          <ChannelCard
                            ref={index === 0 ? firstCardRef : undefined}
                            key={channel.id}
                            channel={channel}
                            onPress={() => handleChannelPress(channel.id)}
                            index={index}
                            rowIndex={0}
                            isDefault={index === 0 && isScreenFocused}
                            isSpatialFocused={isItemFocused(0, index)}
                          />
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}

              <View style={[styles.section, (isTV || isLarge) && { marginBottom: getSpacing(32) }]}>
                <Text style={[
                  styles.sectionTitle, 
                  { 
                    color: colors.text,
                    fontSize: isTV ? getFontSize(24) : 20
                  }
                ]}>
                  Featured Channels
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={[
                    styles.channelRow, 
                    (isTV || isLarge) && { gap: getSpacing(16) },
                    isTV && isLandscape && { paddingBottom: getSpacing(16) }
                  ]}>
                    {featuredChannels.map((channel, index) => (
                      <ChannelCard
                        ref={index === 0 && !hasContinueWatching ? firstCardRef : undefined}
                        key={channel.id}
                        channel={channel}
                        onPress={() => handleChannelPress(channel.id)}
                        index={index}
                        rowIndex={featuredRowIndex}
                        isDefault={index === 0 && !hasContinueWatching && isScreenFocused}
                        isSpatialFocused={isItemFocused(featuredRowIndex, index)}
                      />
                    ))}
                  </View>
                </ScrollView>
              </View>

              {categories.map((category, index) => (
                <CategoryList
                  key={category}
                  category={category}
                  channels={allChannels.filter(c => c.category === category).slice(0, (isTV || isLarge) ? 15 : 10)}
                  onChannelPress={handleChannelPress}
                  categoryIndex={index + firstCategoryRowIndex}
                  isItemFocused={isItemFocused}
                />
              ))}
              
              <Footer />
            </>
          )}
        </ScrollView>
      </ResponsiveLayout>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  channelRow: {
    flexDirection: "row",
    gap: 12,
  },
});