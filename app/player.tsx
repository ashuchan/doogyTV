import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Text, Pressable, ActivityIndicator, Platform, BackHandler, Dimensions, FlatList, findNodeHandle } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/theme-context";
import { usePlaylistStore } from "@/store/playlist-store";
import { useFavoritesStore } from "@/store/favorites-store";
import { useRecentlyWatchedStore } from "@/store/recently-watched-store";
import { 
  ArrowLeft, 
  Heart, 
  Maximize2, 
  Minimize2, 
  Pause, 
  Play, 
  SkipBack, 
  SkipForward,
  Volume2,
  VolumeX,
  Menu
} from "lucide-react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { isTVDevice, isLargeScreen, isGoogleTV } from "@/utils/tv-utils";
import { TVFocusable } from "@/components/TVFocusable";
import { useTVRemoteControl } from "@/hooks/useTVRemoteControl";

export default function PlayerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { playlists } = usePlaylistStore();
  const { favorites, toggleFavorite } = useFavoritesStore();
  const { addToRecentlyWatched } = useRecentlyWatchedStore();
  
  const videoRef = useRef<Video>(null);
  const webVideoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [status, setStatus] = useState<any>({ isPlaying: true });
  const [controlsVisible, setControlsVisible] = useState(true);
  const [guideVisible, setGuideVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));
  
  const dpadCenterRef = useRef<any>(null);
  const dpadUpRef = useRef<any>(null);
  const dpadDownRef = useRef<any>(null);
  const dpadLeftRef = useRef<any>(null);

  const [upNode, setUpNode] = useState<number | null>(null);
  const [downNode, setDownNode] = useState<number | null>(null);
  const [leftNode, setLeftNode] = useState<number | null>(null);

  useEffect(() => {
    if (isTVDevice()) {
      const timer = setTimeout(() => {
        try {
          if (dpadUpRef.current) setUpNode(findNodeHandle(dpadUpRef.current));
          if (dpadDownRef.current) setDownNode(findNodeHandle(dpadDownRef.current));
          if (dpadLeftRef.current) setLeftNode(findNodeHandle(dpadLeftRef.current));
        } catch (e) {
          console.log("Failed to resolve node handles", e);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [guideVisible]);

  
  const [currentChannelId, setCurrentChannelId] = useState<string | undefined>(id);
  
  const allChannels = playlists.flatMap(playlist => playlist.channels || []);
  const channel = allChannels.find(c => c.id === currentChannelId);

  const categoryChannels = channel 
    ? allChannels.filter(c => c.category === channel.category)
    : [];
  const currentIdx = categoryChannels.findIndex(c => c.id === currentChannelId);

  const playPreviousChannel = () => {
    if (categoryChannels.length === 0) return;
    const prevIdx = (currentIdx - 1 + categoryChannels.length) % categoryChannels.length;
    const targetChannel = categoryChannels[prevIdx];
    setCurrentChannelId(targetChannel.id);
    showControls();
  };

  const playNextChannel = () => {
    if (categoryChannels.length === 0) return;
    const nextIdx = (currentIdx + 1) % categoryChannels.length;
    const targetChannel = categoryChannels[nextIdx];
    setCurrentChannelId(targetChannel.id);
    showControls();
  };

  useTVRemoteControl({
    onUp: () => {
      if (!guideVisible) {
        playPreviousChannel();
      }
    },
    onDown: () => {
      if (!guideVisible) {
        playNextChannel();
      }
    },
    onLeft: () => {
      if (!guideVisible) {
        setGuideVisible(true);
        showControls();
      }
    },
    onBack: () => {
      if (guideVisible) {
        setGuideVisible(false);
      } else {
        router.back();
      }
    },
    active: true,
  });
  
  const isFavorite = favorites.includes(currentChannelId || "");
  const isTV = isTVDevice() || isGoogleTV();
  const isLarge = isLargeScreen();
  const isLandscape = dimensions.width > dimensions.height;
  
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Listen for dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });
    
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (id) {
      setCurrentChannelId(id);
    }
  }, [id]);

  useEffect(() => {
    if (currentChannelId) {
      addToRecentlyWatched(currentChannelId);
    }
    
    // Handle back button on Android/TV
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (guideVisible) {
        setGuideVisible(false);
        return true;
      }
      if (controlsVisible) {
        router.back();
        return true;
      } else {
        showControls();
        return true;
      }
    });
    
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
      backHandler.remove();
    };
  }, [currentChannelId, addToRecentlyWatched, controlsVisible, guideVisible]);

  // HLS playback setup for Web
  useEffect(() => {
    if (Platform.OS !== "web" || !channel?.url) return;

    const video = webVideoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);

    const playVideo = () => {
      video.play()
        .then(() => {
          setStatus({ isPlaying: true });
        })
        .catch((err) => {
          console.warn("Autoplay blocked:", err);
          setStatus({ isPlaying: false });
        });
    };

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = channel.url;
      video.addEventListener("loadedmetadata", () => {
        setLoading(false);
        playVideo();
      });
      video.addEventListener("error", () => {
        setError("Failed to load the stream. Please try again later.");
        setLoading(false);
      });
    } else {
      try {
        const Hls = require("hls.js");
        if (!Hls.isSupported()) {
          setError("HLS playback is not supported on this browser.");
          setLoading(false);
          return;
        }

        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hlsRef.current = hls;
        hls.loadSource(channel.url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          playVideo();
        });

        hls.on(Hls.Events.ERROR, (event: any, data: any) => {
          console.error("HLS error:", data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log("Fatal network error, trying to recover...");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log("Fatal media error, trying to recover...");
                hls.recoverMediaError();
                break;
              default:
                setError("Failed to load the stream. Please try again later.");
                setLoading(false);
                hls.destroy();
                break;
            }
          }
        });
      } catch (err) {
        console.error("Failed to load hls.js:", err);
        setError("Failed to load the player modules.");
        setLoading(false);
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel?.url]);

  const hideControlsWithDelay = () => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    
    // On TV, keep controls visible longer
    const delay = isTV ? 5000 : 3000;
    
    controlsTimeout.current = setTimeout(() => {
      setControlsVisible(false);
    }, delay);
  };

  const showControls = () => {
    setControlsVisible(true);
    hideControlsWithDelay();
  };

  const handlePlaybackStatusUpdate = (playbackStatus: any) => {
    setStatus(playbackStatus);
    
    if (playbackStatus.isLoaded) {
      setLoading(false);
      setError(null);
    } else if (playbackStatus.error) {
      setError("An error occurred while playing this stream.");
      setLoading(false);
    }
  };

  const handleError = () => {
    setError("Failed to load the stream. Please try again later.");
    setLoading(false);
  };

  const togglePlayPause = async () => {
    if (Platform.OS === "web") {
      const video = webVideoRef.current;
      if (video) {
        if (video.paused) {
          await video.play().catch(() => {});
          setStatus({ isPlaying: true });
        } else {
          video.pause();
          setStatus({ isPlaying: false });
        }
      }
    } else {
      if (status.isPlaying) {
        await videoRef.current?.pauseAsync();
      } else {
        await videoRef.current?.playAsync();
      }
    }
    showControls();
  };

  const toggleMute = async () => {
    const newMuted = !muted;
    setMuted(newMuted);
    if (Platform.OS === "web") {
      const video = webVideoRef.current;
      if (video) {
        video.muted = newMuted;
      }
    } else {
      await videoRef.current?.setIsMutedAsync(newMuted);
    }
    showControls();
  };

  const handleBack = () => {
    router.back();
  };

  const handleFavoriteToggle = () => {
    if (currentChannelId) {
      toggleFavorite(currentChannelId);
      showControls();
    }
  };

  const handleFullscreen = async () => {
    if (Platform.OS === "web") {
      const container = document.getElementById("video-container");
      if (container) {
        if (!document.fullscreenElement) {
          await container.requestFullscreen().catch(() => {});
          setIsFullscreen(true);
        } else {
          await document.exitFullscreen().catch(() => {});
          setIsFullscreen(false);
        }
      }
    } else {
      if (isFullscreen) {
        setIsFullscreen(false);
      } else {
        if (videoRef.current) {
          await videoRef.current.presentFullscreenPlayer();
          setIsFullscreen(true);
        }
      }
    }
    showControls();
  };

  // Render control button based on platform
  const renderControlButton = (
    icon: React.ReactNode, 
    onPress: () => void, 
    isFirst: boolean = false,
    isLast: boolean = false
  ) => {
    if (isTV) {
      return (
        <TVFocusable
          style={styles.controlButton}
          onPress={onPress}
          nextFocusUp={null}
          nextFocusLeft={isFirst ? null : undefined}
          nextFocusRight={isLast ? null : undefined}
        >
          {icon}
        </TVFocusable>
      );
    }

    return (
      <Pressable style={styles.controlButton} onPress={onPress}>
        {icon}
      </Pressable>
    );
  };

  if (!channel) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Channel not found</Text>
        {isTV ? (
          <TVFocusable
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={handleBack}
            isDefault={true}
          >
            <Text style={[styles.backButtonText, { color: colors.white }]}>Go Back</Text>
          </TVFocusable>
        ) : (
          <Pressable
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={handleBack}
          >
            <Text style={[styles.backButtonText, { color: colors.white }]}>Go Back</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // For TV and large screens, use a different layout
  const videoContainerStyle = (isTV || (isLarge && isLandscape)) 
    ? [styles.videoContainer, { width: "100%" as const, height: "100%" as const }]
    : styles.videoContainer;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar hidden />
      
      {isTV && !guideVisible && (
        <View style={styles.invisibleFocusGrid}>
          <TVFocusable
            ref={dpadCenterRef}
            style={styles.invisibleFocusTarget}
            isDefault={true}
            nextFocusUp={upNode || undefined}
            nextFocusDown={downNode || undefined}
            nextFocusLeft={leftNode || undefined}
            onPress={() => showControls()}
          >
            <View />
          </TVFocusable>
          <TVFocusable
            ref={dpadUpRef}
            style={styles.invisibleFocusTarget}
            onFocus={() => {
              playPreviousChannel();
              dpadCenterRef.current?.requestTVFocus();
            }}
          >
            <View />
          </TVFocusable>
          <TVFocusable
            ref={dpadDownRef}
            style={styles.invisibleFocusTarget}
            onFocus={() => {
              playNextChannel();
              dpadCenterRef.current?.requestTVFocus();
            }}
          >
            <View />
          </TVFocusable>
          <TVFocusable
            ref={dpadLeftRef}
            style={styles.invisibleFocusTarget}
            onFocus={() => {
              setGuideVisible(true);
              showControls();
            }}
          >
            <View />
          </TVFocusable>
        </View>
      )}

      
      <Pressable 
        id="video-container"
        style={videoContainerStyle} 
        onPress={showControls}
      >
        {Platform.OS === "web" ? (
          <video
            ref={webVideoRef}
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#000",
              objectFit: "contain",
            }}
            playsInline
            muted={muted}
          />
        ) : (
          <Video
            ref={videoRef}
            style={styles.video}
            source={{ uri: channel.url }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            onError={handleError}
            isMuted={muted}
            useNativeControls={isTV}
          />
        )}
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size={isTV ? "large" : "large"} color={colors.white} />
            <Text style={[
              styles.loadingText, 
              { fontSize: isTV ? 20 : 16 }
            ]}>
              Loading stream...
            </Text>
          </View>
        )}
        
        {error && (
          <View style={styles.errorOverlay}>
            <Text style={[
              styles.errorText, 
              { fontSize: isTV ? 20 : 16 }
            ]}>
              {error}
            </Text>
            {isTV ? (
              <TVFocusable
                style={[styles.retryButton, { backgroundColor: colors.primary, padding: 16 }]}
                onPress={() => {
                  setLoading(true);
                  setError(null);
                  if (Platform.OS === "web") {
                    const video = webVideoRef.current;
                    if (video && hlsRef.current) {
                      hlsRef.current.loadSource(channel.url);
                    }
                  } else {
                    videoRef.current?.loadAsync({ uri: channel.url }, {}, true);
                  }
                }}
                isDefault={true}
              >
                <Text style={[styles.retryButtonText, { fontSize: 18 }]}>Retry</Text>
              </TVFocusable>
            ) : (
              <Pressable
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setLoading(true);
                  setError(null);
                  if (Platform.OS === "web") {
                    const video = webVideoRef.current;
                    if (video && hlsRef.current) {
                      hlsRef.current.loadSource(channel.url);
                    }
                  } else {
                    videoRef.current?.loadAsync({ uri: channel.url }, {}, true);
                  }
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            )}
          </View>
        )}
        
        {controlsVisible && !guideVisible && (
          <View style={styles.controlsContainer}>
            <LinearGradient
              colors={["rgba(0,0,0,0.7)", "transparent"]}
              style={styles.topGradient}
            >
              <SafeAreaView edges={["top"]} style={styles.topControls}>
                {isTV ? (
                  <TVFocusable 
                    onPress={handleBack} 
                    style={styles.backButtonControl}
                    isDefault={true}
                  >
                    <ArrowLeft size={28} color={colors.white} />
                  </TVFocusable>
                ) : (
                  <Pressable onPress={handleBack} style={styles.backButtonControl}>
                    <ArrowLeft size={24} color={colors.white} />
                  </Pressable>
                )}
                
                <Text 
                  style={[
                    styles.channelTitle, 
                    { fontSize: isTV ? 24 : (isLarge ? 20 : 18) }
                  ]} 
                  numberOfLines={1}
                >
                  {channel.name}
                </Text>
                
                {isTV ? (
                  <TVFocusable onPress={handleFavoriteToggle} style={styles.favoriteButton}>
                    <Heart
                      size={28}
                      color={colors.white}
                      fill={isFavorite ? colors.white : "none"}
                    />
                  </TVFocusable>
                ) : (
                  <Pressable onPress={handleFavoriteToggle} style={styles.favoriteButton}>
                    <Heart
                      size={isLarge ? 28 : 24}
                      color={colors.white}
                      fill={isFavorite ? colors.white : "none"}
                    />
                  </Pressable>
                )}
              </SafeAreaView>
            </LinearGradient>
            
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.85)"]}
              style={styles.bottomGradient}
            >
              <SafeAreaView edges={["bottom"]} style={styles.bottomControls}>
                {/* Info HUD */}
                <View style={styles.hudContainer}>
                  {channel.logo && (
                    <Image
                      source={{ uri: channel.logo }}
                      style={styles.hudLogo}
                      contentFit="contain"
                    />
                  )}
                  <View style={styles.hudTextContainer}>
                    <View style={styles.hudTitleRow}>
                      <Text style={styles.hudTitle}>{channel.name}</Text>
                      <View style={styles.resolutionBadge}>
                        <Text style={styles.resolutionText}>HD 1080p</Text>
                      </View>
                    </View>
                    <Text style={styles.epgText}>Now Playing: Live Broadcast</Text>
                    <View style={styles.epgProgressBarBg}>
                      <View style={[styles.epgProgressBarFill, { width: "45%" }]} />
                    </View>
                  </View>
                </View>

                <View style={styles.playbackControls}>
                  {renderControlButton(
                    status.isPlaying ? (
                      <Pause size={isTV ? 36 : (isLarge ? 32 : 28)} color={colors.white} />
                    ) : (
                      <Play size={isTV ? 36 : (isLarge ? 32 : 28)} color={colors.white} />
                    ),
                    togglePlayPause,
                    true
                  )}
                  
                  {renderControlButton(
                    muted ? (
                      <VolumeX size={isTV ? 28 : (isLarge ? 26 : 24)} color={colors.white} />
                    ) : (
                      <Volume2 size={isTV ? 28 : (isLarge ? 26 : 24)} color={colors.white} />
                    ),
                    toggleMute
                  )}

                  {renderControlButton(
                    <Menu size={isTV ? 28 : (isLarge ? 26 : 24)} color={colors.white} />,
                    () => {
                      setGuideVisible(true);
                      showControls();
                    }
                  )}
                  
                  <View style={styles.spacer} />
                  
                  {renderControlButton(
                    isFullscreen ? (
                      <Minimize2 size={isTV ? 28 : (isLarge ? 26 : 24)} color={colors.white} />
                    ) : (
                      <Maximize2 size={isTV ? 28 : (isLarge ? 26 : 24)} color={colors.white} />
                    ),
                    handleFullscreen,
                    false,
                    true
                  )}
                </View>
              </SafeAreaView>
            </LinearGradient>
          </View>
        )}

        {guideVisible && (
          <View style={styles.guideContainer}>
            <Text style={styles.guideTitle}>Channel Guide</Text>
            <FlatList
              data={categoryChannels}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isCurrent = item.id === currentChannelId;
                return (
                  <TVFocusable
                    style={[
                      styles.guideItem,
                      isCurrent && { backgroundColor: "rgba(6, 182, 212, 0.15)" }
                    ]}
                    focusedStyle={{ borderColor: colors.info }}
                    isDefault={isCurrent}
                    onPress={() => {
                      setCurrentChannelId(item.id);
                      setGuideVisible(false);
                      showControls();
                    }}
                  >
                    <View style={styles.guideItemContent}>
                      {item.logo ? (
                        <Image
                          source={{ uri: item.logo }}
                          style={styles.guideItemLogo}
                          contentFit="contain"
                        />
                      ) : (
                        <View style={styles.guideItemLogoPlaceholder}>
                          <Text style={styles.guideItemPlaceholderText}>
                            {item.name.substring(0, 2).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <Text 
                        style={[
                          styles.guideItemName, 
                          isCurrent && { color: colors.info }
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </View>
                  </TVFocusable>
                );
              }}
              contentContainerStyle={styles.guideListContent}
            />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#000",
  },
  video: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  loadingText: {
    color: "#fff",
    marginTop: 16,
    fontSize: 16,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 20,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  topGradient: {
    height: 100,
  },
  bottomGradient: {
    height: 220,
    justifyContent: "flex-end",
  },
  topControls: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButtonControl: {
    padding: 8,
  },
  channelTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 16,
  },
  favoriteButton: {
    padding: 8,
  },
  bottomControls: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  playbackControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  controlButton: {
    padding: 12,
  },
  spacer: {
    flex: 1,
  },
  hudContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  hudLogo: {
    width: 60,
    height: 45,
    marginRight: 16,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  hudTextContainer: {
    flex: 1,
  },
  hudTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  hudTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  resolutionBadge: {
    backgroundColor: "#06B6D4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 10,
  },
  resolutionText: {
    color: "#090D16",
    fontSize: 10,
    fontWeight: "bold",
  },
  epgText: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 8,
  },
  epgProgressBarBg: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  epgProgressBarFill: {
    height: "100%",
    backgroundColor: "#06B6D4",
  },
  guideContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 320,
    backgroundColor: "rgba(9, 13, 22, 0.95)",
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 20,
    paddingHorizontal: 16,
    zIndex: 200,
  },
  guideTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  guideListContent: {
    paddingBottom: 20,
  },
  guideItem: {
    width: "100%",
    borderRadius: 8,
    marginVertical: 4,
    padding: 8,
  },
  guideItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  guideItemLogo: {
    width: 40,
    height: 30,
    marginRight: 12,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  guideItemLogoPlaceholder: {
    width: 40,
    height: 30,
    marginRight: 12,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  guideItemPlaceholderText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  guideItemName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  invisibleFocusGrid: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    zIndex: 9999,
  },
  invisibleFocusTarget: {
    width: 1,
    height: 1,
  },
});