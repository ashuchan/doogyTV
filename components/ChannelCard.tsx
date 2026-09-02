import React, { useRef } from "react";
import { StyleSheet, View, Text, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/context/theme-context";
import { Channel } from "@/types/channel";
import { useFavoritesStore } from "@/store/favorites-store";
import { useTVNavigationStore } from "@/store/tv-navigation-store";
import { Heart } from "lucide-react-native";
import { isTVDevice, isLargeScreen, getFontSize, getSpacing, isGoogleTV } from "@/utils/tv-utils";
import { TVFocusable } from "@/components/TVFocusable";

type ChannelCardProps = {
  channel: Channel;
  onPress: () => void;
  index?: number;
  rowIndex?: number;
  isDefault?: boolean;
  isSpatialFocused?: boolean;
};

export const ChannelCard = React.forwardRef<any, ChannelCardProps>(({ 
  channel, 
  onPress, 
  index = 0, 
  rowIndex = 0, 
  isDefault = false,
  isSpatialFocused,
}: ChannelCardProps, ref) => {
  const { colors } = useTheme();
  const { favorites } = useFavoritesStore();
  const { setLastFocusedCardKey } = useTVNavigationStore();
  const isFavorite = favorites.includes(channel.id);
  const isTV = isTVDevice() || isGoogleTV();
  const isLarge = isLargeScreen();
  const { width, height } = Dimensions.get("window");
  const isLandscape = width > height;
  
  // Calculate next focus targets for TV navigation
  const getNextFocusProps = () => {
    if (!isTV) return {};
    
    return {
      nextFocusUp: rowIndex > 0 ? undefined : null,
      nextFocusDown: undefined,
      nextFocusLeft: undefined,
      nextFocusRight: undefined,
    };
  };

  // Calculate card width based on screen size and orientation
  let cardWidth = isTV || isLarge ? 200 : 140;
  
  // For TV in landscape mode, make cards larger
  if (isTV && isLandscape) {
    cardWidth = 240;
  }

  const handleCardFocus = () => {
    if (isTV) {
      setLastFocusedCardKey(channel.id);
    }
  };

  // Use TVFocusable for TV devices, regular Pressable for mobile
  if (isTV) {
    return (
      <TVFocusable
        ref={ref}
        isDefault={isDefault}
        isSpatialFocused={isSpatialFocused}
        onFocus={handleCardFocus}
        style={[
          styles.container, 
          { 
            backgroundColor: colors.card,
            width: cardWidth,
            margin: getSpacing(8)
          }
        ]}
        focusedStyle={{ borderColor: colors.primary }}
        onPress={onPress}
        {...getNextFocusProps()}
      >
        <View style={[styles.imageContainer, { height: cardWidth * 0.5625 }]}>
          {channel.logo ? (
            <Image
              source={{ uri: channel.logo }}
              style={styles.logo}
              contentFit="contain"
              transition={200}
            />
          ) : (
            <View style={[styles.placeholderLogo, { backgroundColor: "rgba(255, 179, 56, 0.12)" }]}>
              <Text style={[styles.placeholderIcon]}>🐾</Text>
              <Text style={[styles.placeholderText, { color: colors.text, fontSize: getFontSize(16) }]}>
                {channel.name.substring(0, 3).toUpperCase()}
              </Text>
            </View>
          )}
          {isFavorite && (
            <View style={[styles.favoriteIcon, { backgroundColor: colors.accent || "#FF7582" }]}>
              <Heart size={14} color="#FFF8F0" fill="#FFF8F0" />
            </View>
          )}
        </View>
        <Text
          style={[
            styles.name, 
            { 
              color: colors.text,
              fontSize: getFontSize(14)
            }
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {channel.name}
        </Text>
        <Text style={[
          styles.category, 
          { 
            color: colors.textSecondary,
            fontSize: getFontSize(12)
          }
        ]}>
          {channel.category}
        </Text>
      </TVFocusable>
    );
  }

  // Mobile or browser version
  return (
    <Pressable
      ref={ref}
      style={[
        styles.container, 
        { 
          backgroundColor: colors.card,
          width: isLarge ? 180 : 140
        }
      ]}
      onPress={onPress}
    >
      <View style={[
        styles.imageContainer, 
        { height: (isLarge ? 180 : 140) * 0.5625 }
      ]}>
        {channel.logo ? (
          <Image
            source={{ uri: channel.logo }}
            style={styles.logo}
            contentFit="contain"
            transition={200}
          />
        ) : (
          <View style={[styles.placeholderLogo, { backgroundColor: "rgba(255, 179, 56, 0.12)" }]}>
            <Text style={[styles.placeholderIcon]}>🐾</Text>
            <Text style={[
              styles.placeholderText, 
              { 
                color: colors.text,
                fontSize: isLarge ? 20 : 16
              }
            ]}>
              {channel.name.substring(0, 3).toUpperCase()}
            </Text>
          </View>
        )}
        {isFavorite && (
          <View style={[styles.favoriteIcon, { backgroundColor: colors.accent || "#FF7582" }]}>
            <Heart size={isLarge ? 14 : 12} color="#FFF8F0" fill="#FFF8F0" />
          </View>
        )}
      </View>
      <Text
        style={[
          styles.name, 
          { 
            color: colors.text,
            fontSize: isLarge ? 16 : 14
          }
        ]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {channel.name}
      </Text>
      <Text style={[
        styles.category, 
        { 
          color: colors.textSecondary,
          fontSize: isLarge ? 14 : 12
        }
      ]}>
        {channel.category}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  placeholderLogo: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  placeholderIcon: {
    fontSize: 18,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  favoriteIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    paddingHorizontal: 8,
    height: 38,
  },
  category: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
});