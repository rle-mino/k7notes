import { Platform } from "react-native";

/**
 * Responsive layout density for Web (compact) vs Mobile (comfy).
 *
 * Web: ~48px items, 14-15px fonts, tighter spacing
 * Mobile: ~64px items, 16-17px fonts, larger touch targets
 */

const WEB = {
  itemMinHeight: 48,
  titleSize: 14,
  bodySize: 13,
  captionSize: 11,
  iconSize: 16,
  iconContainerSize: 24,
  paddingH: 12,
  paddingV: 8,
  isCompact: true,
} as const;

const MOBILE = {
  itemMinHeight: 64,
  titleSize: 16,
  bodySize: 15,
  captionSize: 12,
  iconSize: 18,
  iconContainerSize: 32,
  paddingH: 16,
  paddingV: 12,
  isCompact: false,
} as const;

export type LayoutDensity = typeof WEB | typeof MOBILE;

export function useLayoutDensity() {
  return Platform.OS === "web" ? WEB : MOBILE;
}
