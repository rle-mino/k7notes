import React from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Plus } from "lucide-react-native";
import { colors } from "@/theme";

interface HeroFABProps {
  onPress: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Premium floating action button with deep indigo and colored glow shadow.
 * Bottom-center placement on both platforms.
 */
export function HeroFAB({ onPress, size = 56, style }: HeroFABProps) {
  const half = size / 2;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.shadow,
        { width: size, height: size, borderRadius: half },
        style,
      ]}
    >
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: half },
        ]}
      >
        <Plus size={size * 0.43} color="#FFFFFF" strokeWidth={1.5} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  circle: {
    backgroundColor: colors.heroGradientEnd,
    alignItems: "center",
    justifyContent: "center",
  },
});
