import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Pressable, 
  StyleSheet, 
  ViewStyle, 
  StyleProp,
  PressableProps,
  findNodeHandle,
  Animated
} from "react-native";
import { isTVDevice, isGoogleTV } from "@/utils/tv-utils";

interface TVFocusableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  focusedStyle?: StyleProp<ViewStyle>;
  isDefault?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  nextFocusDown?: number | null | undefined;
  nextFocusUp?: number | null | undefined;
  nextFocusLeft?: number | null | undefined;
  nextFocusRight?: number | null | undefined;
}

export function TVFocusable({
  children,
  style,
  focusedStyle,
  isDefault = false,
  onFocus,
  onBlur,
  nextFocusDown,
  nextFocusUp,
  nextFocusLeft,
  nextFocusRight,
  ...props
}: TVFocusableProps) {
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const ref = useRef(null);
  const isTV = isTVDevice() || isGoogleTV();
  
  useEffect(() => {
    if (isTV && isDefault) {
      // Request focus for this element if it's the default
      const tag = findNodeHandle(ref.current);
      if (tag) {
        setTimeout(() => {
          try {
            // @ts-ignore - This is a TV-specific API
            ref.current?.requestTVFocus();
          } catch (e) {
            console.log("Failed to request TV focus", e);
          }
        }, 100);
      }
    }
  }, [isDefault, isTV]);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(scaleAnim, {
      toValue: 1.04,
      duration: 150,
      useNativeDriver: true,
    }).start();
    if (onFocus) onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(scaleAnim, {
      toValue: 1.0,
      duration: 150,
      useNativeDriver: true,
    }).start();
    if (onBlur) onBlur();
  };

  // TV-specific props
  const tvProps = isTV 
    ? {
        hasTVPreferredFocus: isDefault,
        tvParallaxProperties: { enabled: false },
        nextFocusDown,
        nextFocusUp,
        nextFocusLeft,
        nextFocusRight,
      } 
    : {};

  return (
    <Pressable
      ref={ref}
      {...props}
      {...tvProps}
      style={[
        styles.container,
        style,
        isFocused && styles.focused,
        isFocused && focusedStyle,
      ]}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1, width: "100%" }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: "visible", // Allow animated scale and glow shadow to show
  },
  focused: {
    borderWidth: 3,
    borderColor: "#06B6D4", // Neon Cyan focus indicator
    shadowColor: "#06B6D4",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
});