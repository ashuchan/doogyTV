import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "@/context/theme-context";
import { TVFocusable } from "@/components/TVFocusable";
import { isTVDevice, isGoogleTV } from "@/utils/tv-utils";

interface CuteEmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export function CuteEmptyState({
  icon = "🐶",
  title,
  description,
  actionLabel,
  onAction,
  testID = "cute-empty-state",
}: CuteEmptyStateProps) {
  const { colors } = useTheme();
  const isTV = isTVDevice() || isGoogleTV();

  return (
    <View style={styles.container} testID={testID}>
      <View style={[styles.iconCircle, { backgroundColor: "rgba(255, 179, 56, 0.12)" }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      )}

      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          {isTV ? (
            <TVFocusable
              isDefault={true}
              onPress={onAction}
              style={[
                styles.actionButton,
                { backgroundColor: colors.primary }
              ]}
              focusedStyle={{
                borderColor: colors.text,
                borderWidth: 2.5,
              }}
              testID={`${testID}-action`}
            >
              <Text style={[styles.actionButtonText, { color: colors.textInverted || "#12131C" }]}>
                {actionLabel}
              </Text>
            </TVFocusable>
          ) : (
            <Pressable
              onPress={onAction}
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              testID={`${testID}-action`}
            >
              <Text style={[styles.actionButtonText, { color: colors.textInverted || "#12131C" }]}>
                {actionLabel}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    minHeight: 280,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    textAlign: "center",
    maxWidth: 360,
    lineHeight: 22,
    marginBottom: 20,
  },
  actionContainer: {
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 160,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
