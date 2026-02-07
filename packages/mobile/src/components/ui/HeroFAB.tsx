import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Plus } from "lucide-react-native";
import { colors } from "@/theme";

interface HeroFABProps {
  onPress: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Premium floating action button with indigo gradient and colored glow shadow.
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
      <LinearGradient
        colors={[colors.heroGradientStart, colors.heroGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          { width: size, height: size, borderRadius: half },
        ]}
      >
        <Plus size={size * 0.43} color="#FFFFFF" strokeWidth={1.5} />
      </LinearGradient>
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
  gradient: {
    alignItems: "center",
    justifyContent: "center",
  },
});
