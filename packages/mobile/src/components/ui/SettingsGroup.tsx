import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, typography, spacing, radius, shadows } from "@/theme";

interface SettingsGroupProps {
  title?: string;
  children: React.ReactNode;
}

/**
 * iOS "Inset Grouped" style container for settings.
 * White card with rounded corners on a gray background.
 * Rows inside are borderless — spacing provides the visual separation.
 */
export function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.card}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  title: {
    ...typography.overline,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.sm,
  },
});
