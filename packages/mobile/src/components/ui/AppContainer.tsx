import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { colors, spacing, radius, shadows } from "@/theme";

interface AppContainerProps {
  children: React.ReactNode;
  /** Whether to render the content sheet (white surface on gray bg) */
  sheet?: boolean;
  style?: ViewStyle;
}

/**
 * Top-level container that simulates a premium "paper sheet on a desk" layout.
 * When `sheet` is true, it renders a white content surface with subtle elevation
 * on top of the soft gray background.
 */
export function AppContainer({ children, sheet = false, style }: AppContainerProps) {
  if (!sheet) {
    return (
      <View style={[styles.container, style]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.sheet}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    margin: spacing.base,
    borderRadius: radius.lg,
    ...shadows.sm,
    overflow: "hidden",
  },
});
