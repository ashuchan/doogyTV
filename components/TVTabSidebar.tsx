import React, { useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useTheme } from "@/context/theme-context";
import { TVFocusable } from "@/components/TVFocusable";
import { Home, Tv2, Heart, Settings, Search } from "lucide-react-native";
import { useTVNavigationStore } from "@/store/tv-navigation-store";
import { useTVRemoteControl } from "@/hooks/useTVRemoteControl";

interface TVTabSidebarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export function TVTabSidebar({ state, descriptors, navigation }: TVTabSidebarProps) {
  const { colors } = useTheme();
  const { activeZone, sidebarIndex, setSidebarIndex, setActiveZone } = useTVNavigationStore();
  const [localExpanded, setLocalExpanded] = useState(false);
  const widthAnim = useRef(new Animated.Value(70)).current;
  const scrimAnim = useRef(new Animated.Value(0)).current;

  const isExpanded = localExpanded || activeZone === "sidebar";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: isExpanded ? 220 : 70,
        duration: 180,
        useNativeDriver: false,
      }),
      Animated.timing(scrimAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 180,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isExpanded]);

  const handleSidebarFocus = (index: number) => {
    setLocalExpanded(true);
    setActiveZone("sidebar");
    setSidebarIndex(index);
  };

  const handleSidebarBlur = () => {
    setTimeout(() => {
      setLocalExpanded(false);
      setActiveZone("content");
    }, 50);
  };

  // TV Remote controls when sidebar is active
  useTVRemoteControl({
    active: isExpanded,
    onUp: () => {
      if (sidebarIndex > 0) {
        setSidebarIndex(sidebarIndex - 1);
      }
    },
    onDown: () => {
      if (sidebarIndex < state.routes.length - 1) {
        setSidebarIndex(sidebarIndex + 1);
      }
    },
    onRight: () => {
      setLocalExpanded(false);
      setActiveZone("content");
    },
    onSelect: () => {
      const route = state.routes[sidebarIndex];
      if (route) {
        navigation.navigate({ name: route.name, merge: true });
        setLocalExpanded(false);
        setActiveZone("content");
      }
    },
  });

  const icons = {
    index: Home,
    channels: Tv2,
    search: Search,
    favorites: Heart,
    settings: Settings,
  };

  return (
    <>
      {/* Dimming Backdrop Scrim */}
      <Animated.View
        pointerEvents={isExpanded ? "auto" : "none"}
        style={[
          styles.scrim,
          {
            opacity: scrimAnim,
            backgroundColor: "rgba(18, 19, 28, 0.65)",
          },
        ]}
      />

      <Animated.View 
        style={[
          styles.sidebar, 
          { 
            width: widthAnim, 
            backgroundColor: colors.surface || "#1E1F2E", 
            borderRightColor: colors.border 
          }
        ]}
      >
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, { color: colors.primary }]}>
            {isExpanded ? "doggyTV" : "dTV"}
          </Text>
        </View>

        <View style={styles.navItemsContainer}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label = options.title !== undefined ? options.title : route.name;
            const isTabActive = state.index === index;
            const isItemSpatialFocused = isExpanded && sidebarIndex === index;
            
            const Icon = icons[route.name as keyof typeof icons] || Tv2;

            const onPress = () => {
              setSidebarIndex(index);
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isTabActive && !event.defaultPrevented) {
                navigation.navigate({ name: route.name, merge: true });
              }
              setLocalExpanded(false);
              setActiveZone("content");
            };

            const itemHighlightColor = isItemSpatialFocused 
              ? colors.primary 
              : isTabActive 
                ? colors.primary 
                : colors.text;

            return (
              <TVFocusable
                key={route.key}
                testID={`sidebar-nav-${route.name}`}
                onPress={onPress}
                onFocus={() => handleSidebarFocus(index)}
                onBlur={handleSidebarBlur}
                isSpatialFocused={isItemSpatialFocused}
                style={[
                  styles.navItem,
                  isTabActive && { backgroundColor: "rgba(255, 179, 56, 0.12)" }
                ]}
                focusedStyle={{ borderColor: colors.primary }}
              >
                <View style={styles.navItemContent}>
                  <Icon 
                    size={24} 
                    color={itemHighlightColor} 
                  />
                  {isExpanded && (
                    <Text 
                      style={[
                        styles.navLabel, 
                        { color: itemHighlightColor }
                      ]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  )}
                </View>
              </TVFocusable>
            );
          })}
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    borderRightWidth: 1,
    paddingVertical: 20,
    alignItems: "flex-start",
    overflow: "hidden",
  },
  logoContainer: {
    height: 60,
    width: "100%",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  navItemsContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 10,
    gap: 15,
  },
  navItem: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  navItemContent: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  navLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 15,
  },
});
