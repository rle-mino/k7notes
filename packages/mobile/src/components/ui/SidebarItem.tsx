import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { colors, typography, spacing, radius } from "@/theme";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onPress: () => void;
}

/**
 * Premium sidebar navigation item with a rounded, subtle active state.
 * Replaces the full-width blue rectangle with a soft gray pill.
 */
export function SidebarItem({ icon: IconComponent, label, active, onPress }: SidebarItemProps) {
  return (
    <TouchableOpacity
      style={[styles.container, active && styles.containerActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <IconComponent
          size={18}
          color={active ? colors.textPrimary : colors.textTertiary}
          strokeWidth={active ? 2.2 : 1.8}
        />
      </View>
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  containerActive: {
    backgroundColor: colors.border,
  },
  iconContainer: {
    width: 20,
    alignItems: "center",
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
});
