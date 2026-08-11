import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Text, FlatList, Pressable, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import { useTheme } from "@/context/theme-context";
import { usePlaylistStore } from "@/store/playlist-store";
import { Channel } from "@/types/channel";
import { TVFocusable } from "@/components/TVFocusable";
import { isTVDevice, isLargeScreen, getFontSize, getSpacing } from "@/utils/tv-utils";
import { Image } from "expo-image";
import { Play, Tv2 } from "lucide-react-native";
import { useTVRemoteControl } from "@/hooks/useTVRemoteControl";

export default function ChannelsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { playlists, loading } = usePlaylistStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Tivimate focused channel for preview
  const [focusedChannel, setFocusedChannel] = useState<Channel | null>(null);
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const previewVideoRef = useRef<Video>(null);

  const isTV = isTVDevice() || isGoogleTV() || isLargeScreen();
  const isLandscape = dimensions.width > dimensions.height;
  const isTivimateLayout = isTV;

  // Listen for dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });
    return () => subscription.remove();
  }, []);

  const allChannels = playlists.flatMap(playlist => playlist.channels || []);
  const categories = [...new Set(allChannels.map(channel => channel.category))].sort();
  
  const filteredChannels = selectedCategory
    ? allChannels.filter(channel => channel.category === selectedCategory)
    : allChannels;

  // Initialize selectedCategory and default focusedChannel
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (filteredChannels.length > 0 && !focusedChannel) {
      setFocusedChannel(filteredChannels[0]);
    }
  }, [filteredChannels, focusedChannel]);

  const handleChannelPress = (channelId: string) => {
    router.push(`/player?id=${channelId}`);
  };

  const handleChannelFocus = (channel: Channel) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    // Debounce preview playing to avoid streaming every channel when scrolling fast
    debounceTimer.current = setTimeout(() => {
      setFocusedChannel(channel);
    }, 300);
  };

  // Enable remote keys in the Channels screen to navigate categories and channels
  useTVRemoteControl({
    onBack: () => {
      router.replace("/(tabs)");
    },
    active: isTivimateLayout,
  });

  // Render a Category Item on the Left Bar
  const renderCategoryItem = ({ item, index }: { item: string | null; index: number }) => {
    const isSelected = selectedCategory === item;
    const label = item === null ? "All Channels" : item;

    return (
      <TVFocusable
        style={[
          styles.categoryItem,
          isSelected && { backgroundColor: "rgba(6, 182, 212, 0.15)" },
        ]}
        focusedStyle={{ borderColor: colors.info }}
        onPress={() => {
          setSelectedCategory(item);
          // Focus the first channel in the new category
          const newChannels = item ? allChannels.filter(c => c.category === item) : allChannels;
          if (newChannels.length > 0) {
            setFocusedChannel(newChannels[0]);
          }
        }}
      >
        <Text
          style={[
            styles.categoryItemText,
            { color: isSelected ? colors.info : colors.text },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </TVFocusable>
    );
  };

  // Render a Channel Item in the Tivimate Vertical List (exactly 5 items visible in bottom half)
  const renderTivimateChannelItem = ({ item }: { item: Channel }) => {
    const isFocused = focusedChannel?.id === item.id;
    // Bottom list height is 350px. 5 items -> exactly 70px per item
    const itemHeight = 70;

    return (
      <TVFocusable
        style={[
          styles.tivimateChannelItem,
          { height: itemHeight },
          isFocused && { backgroundColor: "rgba(255, 255, 255, 0.05)" },
        ]}
        focusedStyle={{ borderColor: colors.info }}
        onFocus={() => handleChannelFocus(item)}
        onPress={() => handleChannelPress(item.id)}
      >
        <View style={styles.channelRow}>
          {item.logo ? (
            <Image source={{ uri: item.logo }} style={styles.channelLogo} contentFit="contain" />
          ) : (
            <View style={styles.channelLogoPlaceholder}>
              <Tv2 size={20} color={colors.text} />
            </View>
          )}
          <View style={styles.channelInfoText}>
            <Text style={[styles.channelName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.epgShortText} numberOfLines={1}>
              Now Playing: Live Broadcast Stream
            </Text>
          </View>
          <Play size={18} color={isFocused ? colors.info : "transparent"} style={styles.playIcon} />
        </View>
      </TVFocusable>
    );
  };

  if (loading && !allChannels.length) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading Playlist Channels...</Text>
      </SafeAreaView>
    );
  }

  // TIVIMATE SPLIT LAYOUT FOR TV/LANDSCAPE
  if (isTivimateLayout) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["left", "right", "bottom"]}>
        <View style={styles.tivimateWrapper}>
          
          {/* Left Column: Categories List */}
          <View style={[styles.categoriesLeftBar, { borderRightColor: colors.border }]}>
            <View style={styles.sidebarHeader}>
              <Text style={[styles.sidebarTitle, { color: colors.info }]}>Categories</Text>
            </View>
            <FlatList
              data={[null, ...categories]}
              keyExtractor={(item) => item || "all"}
              renderItem={renderCategoryItem}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Right Column: Split Vertically (Top Preview/EPG, Bottom Channel List) */}
          <View style={styles.contentRightColumn}>
            
            {/* Top Half: Channel Preview and EPG Details */}
            <View style={styles.previewTopHalf}>
              {focusedChannel ? (
                <View style={styles.previewContainer}>
                  <View style={styles.previewVideoBox}>
                    <Video
                      ref={previewVideoRef}
                      source={{ uri: focusedChannel.url }}
                      style={styles.previewVideo}
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay
                      isMuted
                    />
                  </View>
                  <View style={styles.previewDetails}>
                    <View style={styles.detailsHeader}>
                      {focusedChannel.logo && (
                        <Image source={{ uri: focusedChannel.logo }} style={styles.detailsLogo} contentFit="contain" />
                      )}
                      <View>
                        <Text style={[styles.detailsName, { color: colors.text }]} numberOfLines={1}>
                          {focusedChannel.name}
                        </Text>
                        <Text style={[styles.detailsCategory, { color: colors.info }]}>
                          {focusedChannel.category || "General"}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.epgTitle, { color: colors.text }]} numberOfLines={1}>
                      Live Program Broadcast
                    </Text>
                    <Text style={styles.epgDescription}>
                      High-quality live IPTV channel stream direct to your TV. Press OK/Select to play in full screen.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.noFocusedChannel}>
                  <Tv2 size={48} color={colors.text} />
                  <Text style={{ color: colors.text, marginTop: 12 }}>No channel focused</Text>
                </View>
              )}
            </View>

            {/* Bottom Half: Channels List (Exactly 5 items visible in 350px container) */}
            <View style={[styles.listBottomHalf, { borderTopColor: colors.border }]}>
              <FlatList
                data={filteredChannels}
                keyExtractor={(item) => item.id}
                renderItem={renderTivimateChannelItem}
                showsVerticalScrollIndicator={true}
                getItemLayout={(data, index) => ({
                  length: 70,
                  offset: 70 * index,
                  index,
                })}
              />
            </View>

          </View>
        </View>
      </SafeAreaView>
    );
  }

  // STANDARD MOBILE PORTRAIT LAYOUT
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <View style={styles.mobileCategoryBar}>
        <FlatList
          horizontal
          data={[null, ...categories]}
          keyExtractor={(item) => item || "all"}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <Pressable
                style={[
                  styles.mobileCategoryTab,
                  isSelected && { backgroundColor: colors.primary },
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={{ color: isSelected ? colors.white : colors.text }}>
                  {item || "All"}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        data={filteredChannels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.mobileChannelCard, { borderBottomColor: colors.border }]}
            onPress={() => handleChannelPress(item.id)}
          >
            {item.logo ? (
              <Image source={{ uri: item.logo }} style={styles.mobileLogo} contentFit="contain" />
            ) : (
              <View style={styles.mobileLogoPlaceholder}>
                <Tv2 size={24} color={colors.text} />
              </View>
            )}
            <View style={styles.mobileTextCol}>
              <Text style={{ color: colors.text, fontWeight: "bold" }}>{item.name}</Text>
              <Text style={{ color: "#888", fontSize: 12 }}>{item.category || "General"}</Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  tivimateWrapper: {
    flex: 1,
    flexDirection: "row",
  },
  categoriesLeftBar: {
    width: 240,
    height: "100%",
    borderRightWidth: 1,
    paddingVertical: 12,
  },
  sidebarHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 2,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  categoryItemText: {
    fontSize: 15,
    fontWeight: "500",
  },
  contentRightColumn: {
    flex: 1,
    height: "100%",
  },
  previewTopHalf: {
    flex: 1,
    padding: 16,
  },
  previewContainer: {
    flex: 1,
    flexDirection: "row",
    gap: 16,
  },
  previewVideoBox: {
    width: "45%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    borderRadius: 8,
    overflow: "hidden",
  },
  previewVideo: {
    width: "100%",
    height: "100%",
  },
  previewDetails: {
    flex: 1,
    justifyContent: "center",
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  detailsLogo: {
    width: 50,
    height: 38,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  detailsName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  detailsCategory: {
    fontSize: 12,
    fontWeight: "600",
  },
  epgTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginVertical: 4,
  },
  epgDescription: {
    fontSize: 12,
    color: "#888",
    lineHeight: 16,
  },
  noFocusedChannel: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listBottomHalf: {
    height: 350, // Exactly accommodates 5 items of 70px each
    borderTopWidth: 1,
  },
  tivimateChannelItem: {
    paddingHorizontal: 16,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
  },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  channelLogo: {
    width: 48,
    height: 36,
    marginRight: 12,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  channelLogoPlaceholder: {
    width: 48,
    height: 36,
    marginRight: 12,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  channelInfoText: {
    flex: 1,
  },
  channelName: {
    fontSize: 15,
    fontWeight: "bold",
  },
  epgShortText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  playIcon: {
    marginLeft: 8,
  },
  mobileCategoryBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  mobileCategoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  mobileChannelCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
  },
  mobileLogo: {
    width: 50,
    height: 38,
    marginRight: 12,
  },
  mobileLogoPlaceholder: {
    width: 50,
    height: 38,
    marginRight: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  mobileTextCol: {
    flex: 1,
  },
});