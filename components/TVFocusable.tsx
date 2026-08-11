import React, { useState, useRef, useEffect, useImperativeHandle } from "react";
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

export const TVFocusable = React.forwardRef<any, TVFocusableProps>(({
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
}: TVFocusableProps, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressableRef = useRef<any>(null);
  const isTV = isTVDevice() || isGoogleTV();
  
  useImperativeHandle(ref, () => ({
    requestTVFocus: () => {
      try {
        pressableRef.current?.requestTVFocus();
      } catch (e) {
        console.log("Failed to request TV focus via imperative handle", e);
      }
    },
    focus: () => {
      try {
        pressableRef.current?.focus();
      } catch (e) {
        console.log("Failed to focus via imperative handle", e);
      }
    }
  }));

  useEffect(() => {
    if (isTV && isDefault) {
      setTimeout(() => {
        try {
          pressableRef.current?.requestTVFocus();
        } catch (e) {
          console.log("Failed to request TV focus in useEffect", e);
        }
      }, 100);
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
      ref={pressableRef}
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
      <Animated.View style={{ transform: [{ scale: scaleAnim }], width: "100%", height: "100%", justifyContent: "center" }}>
        {children}
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 6,
    overflow: "hidden",
  },
  focused: {
    borderColor: "#06B6D4", // Neon Cyan default focus color
    shadowColor: "#06B6D4",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
});