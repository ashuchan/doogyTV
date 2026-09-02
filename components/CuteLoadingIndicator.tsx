import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useTheme } from "@/context/theme-context";

interface CuteLoadingIndicatorProps {
  message?: string;
  size?: number;
  testID?: string;
}

export function CuteLoadingIndicator({
  message = "Loading...",
  size = 48,
  testID = "cute-loading-indicator",
}: CuteLoadingIndicatorProps) {
  const { colors } = useTheme();
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={styles.container} testID={testID}>
      <Animated.View
        style={[
          styles.mascotWrapper,
          {
            transform: [{ translateY: bounceAnim }],
          },
        ]}
      >
        <Text style={[styles.mascot, { fontSize: size }]}>🐶</Text>
      </Animated.View>
      <View style={styles.dotsRow}>
        <Text style={styles.pawIcon}>🐾</Text>
      </View>
      {message ? (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  mascotWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  mascot: {
    textAlign: "center",
  },
  dotsRow: {
    marginTop: 8,
    alignItems: "center",
  },
  pawIcon: {
    fontSize: 16,
  },
  message: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
});
