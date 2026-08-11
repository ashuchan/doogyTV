import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { useTheme } from "@/context/theme-context";
import { TVFocusable } from "@/components/TVFocusable";
import { Home, Tv2, Heart, Settings, Search } from "lucide-react-native";

interface TVTabSidebarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export function TVTabSidebar({ state, descriptors, navigation }: TVTabSidebarProps) {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const widthAnim = useRef(new Animated.Value(70)).current;

  const handleSidebarFocus = () => {
    setIsExpanded(true);
    Animated.timing(widthAnim, {
      toValue: 220,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleSidebarBlur = () => {
    // Small timeout to check if focus moved to another item in the sidebar
    setTimeout(() => {
      setIsExpanded(false);
      Animated.timing(widthAnim, {
        toValue: 70,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }, 50);
  };

  const icons = {
    index: Home,
    channels: Tv2,
    search: Search,
    favorites: Heart,
    settings: Settings,
  };

  return (
    <Animated.View 
      style={[
        styles.sidebar, 
        { 
          width: widthAnim, 
          backgroundColor: colors.background, 
          borderRightColor: colors.border 
        }
      ]}
    >
      <View style={styles.logoContainer}>
        <Text style={[styles.logoText, { color: colors.info }]}>
          {isExpanded ? "doggyTV" : "dTV"}
        </Text>
      </View>

      <View style={styles.navItemsContainer}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.title !== undefined ? options.title : route.name;
          const isFocused = state.index === index;
          
          // Get matching Icon component
          const Icon = icons[route.name as keyof typeof icons] || Tv2;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate({ name: route.name, merge: true });
            }
          };

          return (
            <TVFocusable
              key={route.key}
              testID={`sidebar-nav-${route.name}`}
              onPress={onPress}
              onFocus={handleSidebarFocus}
              onBlur={handleSidebarBlur}
              style={[
                styles.navItem,
                isFocused && { backgroundColor: "rgba(255, 255, 255, 0.05)" }
              ]}
              focusedStyle={{ borderColor: colors.info }}
            >
              <View style={styles.navItemContent}>
                <Icon 
                  size={24} 
                  color={isFocused ? colors.info : colors.text} 
                />
                {isExpanded && (
                  <Text 
                    style={[
                      styles.navLabel, 
                      { color: isFocused ? colors.info : colors.text }
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
  );
}

const styles = StyleSheet.create({
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
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  navItemsContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 10,
    gap: 15,
  },
  navItem: {
    width: "100%",
    borderRadius: 8,
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
    fontWeight: "500",
    marginLeft: 15,
  },
});
