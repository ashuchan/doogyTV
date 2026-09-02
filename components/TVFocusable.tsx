import React, { useState, useRef, useImperativeHandle, useEffect } from "react";
import { 
  Pressable, 
  StyleSheet, 
  ViewStyle, 
  StyleProp,
  Animated,
  Platform,
  View,
  findNodeHandle
} from "react-native";
import { isTVDevice, isGoogleTV } from "@/utils/tv-utils";

interface TVFocusableProps {
  children: React.ReactNode | ((state: { focused: boolean }) => React.ReactNode);
  style?: StyleProp<ViewStyle>;
  focusedStyle?: StyleProp<ViewStyle>;
  isDefault?: boolean;
  isSpatialFocused?: boolean;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onPress?: () => void;
  nextFocusDown?: number | null | undefined;
  nextFocusUp?: number | null | undefined;
  nextFocusLeft?: number | null | undefined;
  nextFocusRight?: number | null | undefined;
  testID?: string;
}

interface FocusAnimatedContainerProps {
  isFocused: boolean;
  style?: any;
  focusedStyle?: any;
  disabled?: boolean;
  testID?: string;
  children: React.ReactNode;
}

function FocusAnimatedContainer({
  isFocused,
  style,
  focusedStyle,
  disabled,
  testID,
  children,
}: FocusAnimatedContainerProps) {
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1.04 : 1.0)).current;
  const glowAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: isFocused ? 1.04 : 1.0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: isFocused ? 1 : 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isFocused]);

  const animatedContainerStyle = {
    transform: [{ scale: scaleAnim }],
    elevation: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 8],
    }),
    shadowOpacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.45],
    }),
    shadowRadius: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [2, 10],
    }),
  };

  return (
    <Animated.View
      testID={testID ? `${testID}-container` : undefined}
      style={[
        styles.container,
        style,
        animatedContainerStyle,
        isFocused && styles.activeFocusedContainer,
        isFocused && focusedStyle,
        disabled && { opacity: 0.5 },
      ]}
    >
      <View style={styles.innerClippingContainer}>
        {children}
      </View>
    </Animated.View>
  );
}

export const TVFocusable = React.forwardRef<any, TVFocusableProps>(({
  children,
  style,
  focusedStyle,
  isDefault = false,
  isSpatialFocused,
  disabled = false,
  onFocus,
  onBlur,
  onPress,
  nextFocusDown,
  nextFocusUp,
  nextFocusLeft,
  nextFocusRight,
  testID,
  ...props
}: TVFocusableProps, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const localRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    requestTVFocus: () => {
      try {
        console.log("[DOGGYTV] requestTVFocus called. Has requestTVFocus:", !!localRef.current?.requestTVFocus, "Has focus:", !!localRef.current?.focus);
        if (localRef.current?.requestTVFocus) {
          localRef.current.requestTVFocus();
        } else if (localRef.current?.focus) {
          localRef.current.focus();
        }
      } catch (e) {
        console.log("Failed to request TV focus via imperative handle", e);
      }
    },
    focus: () => {
      try {
        console.log("[DOGGYTV] focus called. Has requestTVFocus:", !!localRef.current?.requestTVFocus, "Has focus:", !!localRef.current?.focus);
        if (localRef.current?.requestTVFocus) {
          localRef.current.requestTVFocus();
        } else if (localRef.current?.focus) {
          localRef.current.focus();
        }
      } catch (e) {
        console.log("Failed to focus via imperative handle", e);
      }
    },
    getNativeTag: () => {
      try {
        return findNodeHandle(localRef.current);
      } catch (e) {
        console.log("Failed to find node handle in getNativeTag", e);
        return null;
      }
    }
  }));

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) onBlur();
  };

  const isTV = isTVDevice() || isGoogleTV();

  // Keep native DOM and TV focus strictly in sync with spatial focus state
  useEffect(() => {
    if (isSpatialFocused && localRef.current) {
      if (Platform.OS === "web") {
        try {
          localRef.current.focus?.();
        } catch (e) {}
      } else if (isTV) {
        try {
          localRef.current.requestTVFocus?.();
        } catch (e) {}
      }
    }
  }, [isSpatialFocused, isTV]);

  if (isTV) {
    const tvPressableProps: any = {
      ref: localRef,
      focusable: !disabled,
      accessible: true,
      hasTVPreferredFocus: isDefault,
      disabled,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onPress: disabled ? undefined : onPress,
      testID,
      nextFocusDown: nextFocusDown ?? undefined,
      nextFocusUp: nextFocusUp ?? undefined,
      nextFocusLeft: nextFocusLeft ?? undefined,
      nextFocusRight: nextFocusRight ?? undefined,
      style: styles.pressableWrapper,
      ...props,
    };

    return (
      <Pressable {...tvPressableProps}>
        {({ focused }: { focused?: boolean }) => {
          const activeFocus = isSpatialFocused !== undefined 
            ? isSpatialFocused 
            : (typeof focused === "boolean" ? focused : isFocused);
          return (
            <FocusAnimatedContainer
              isFocused={activeFocus}
              style={style}
              focusedStyle={focusedStyle}
              disabled={disabled}
              testID={testID}
            >
              {typeof children === "function" ? children({ focused: activeFocus }) : children}
            </FocusAnimatedContainer>
          );
        }}
      </Pressable>
    );
  }

  return (
    <Pressable
      ref={localRef}
      style={[
        styles.container,
        style,
        disabled && { opacity: 0.5 },
      ]}
      onPress={disabled ? undefined : onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled}
      testID={testID}
      {...props}
    >
      {typeof children === "function" ? children({ focused: false }) : children}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressableWrapper: {
    // Pressable wrapper must be visible so that children aren't clipped during scale/glow
    overflow: "visible",
  },
  container: {
    borderWidth: 2.5,
    borderColor: "transparent",
    borderRadius: 12,
    backgroundColor: "transparent",
    overflow: "visible", 
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
  },
  activeFocusedContainer: {
    borderColor: "#FFFFFF",
    borderWidth: 2.5,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  innerClippingContainer: {
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
  },
});