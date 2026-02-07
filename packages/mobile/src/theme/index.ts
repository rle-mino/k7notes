/**
 * K7Notes Design System
 *
 * A sophisticated "Monochrome + Accent" design system inspired by
 * Linear, Craft Docs, and Superhuman. Built for clarity, calmness,
 * and efficiency targeting executive users.
 */

// ─── Color Palette ────────────────────────────────────────────────
export const colors = {
  // Backgrounds
  surface: "#FFFFFF",
  background: "#F9FAFB",
  sidebar: "#F3F4F6",
  elevated: "#FFFFFF",

  // Text
  textPrimary: "#0F172A", // Slate-900
  textSecondary: "#64748B", // Slate-500
  textTertiary: "#94A3B8", // Slate-400
  textInverse: "#FFFFFF",

  // Accent — deep professional Indigo
  accent: "#4F46E5",
  accentLight: "#EEF2FF", // Indigo-50
  accentMuted: "#C7D2FE", // Indigo-200

  // Status
  success: "#059669", // Emerald-600
  warning: "#D97706", // Amber-600
  error: "#DC2626", // Red-600
  errorLight: "#FEF2F2", // Red-50

  // Borders & Dividers
  border: "#E2E8F0", // Slate-200
  borderLight: "#F1F5F9", // Slate-100
  divider: "#F1F5F9",

  // Folder accent (warm amber)
  folder: "#F59E0B",
  folderLight: "#FFFBEB",

  // Note icon (cool gray)
  noteIcon: "#9CA3AF",

  // Hero FAB gradient
  heroGradientStart: "#6366F1",
  heroGradientEnd: "#4338CA",

  // Audio accent
  audio: "#EA580C",
  audioLight: "#FFF7ED",

  // Overlay
  overlay: "rgba(15, 23, 42, 0.4)",
} as const;

// ─── Typography ───────────────────────────────────────────────────
export const typography = {
  // Display — for hero/large titles in the editor
  display: {
    fontSize: 32,
    fontWeight: "700" as const,
    letterSpacing: -0.8,
    lineHeight: 40,
    color: colors.textPrimary,
  },

  // Heading 1 — page titles
  h1: {
    fontSize: 24,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
    lineHeight: 32,
    color: colors.textPrimary,
  },

  // Heading 2 — section headings
  h2: {
    fontSize: 20,
    fontWeight: "600" as const,
    letterSpacing: -0.3,
    lineHeight: 28,
    color: colors.textPrimary,
  },

  // Heading 3 — subsection headings
  h3: {
    fontSize: 17,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
    lineHeight: 24,
    color: colors.textPrimary,
  },

  // Body — main content text
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 24, // ~1.6 ratio
    color: colors.textPrimary,
  },

  // Body Medium — emphasized body
  bodyMedium: {
    fontSize: 15,
    fontWeight: "500" as const,
    lineHeight: 24,
    color: colors.textPrimary,
  },

  // Small — secondary content
  small: {
    fontSize: 13,
    fontWeight: "400" as const,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  // Caption — metadata, dates
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
    color: colors.textTertiary,
  },

  // Label — navigation labels, sidebar items
  label: {
    fontSize: 14,
    fontWeight: "500" as const,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  // Overline — section headers in settings, uppercase metadata
  overline: {
    fontSize: 11,
    fontWeight: "600" as const,
    letterSpacing: 1,
    lineHeight: 16,
    textTransform: "uppercase" as const,
    color: colors.textTertiary,
  },
} as const;

// ─── Spacing (4px grid) ──────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
} as const;

// ─── Border Radius ───────────────────────────────────────────────
export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────
export const shadows = {
  sm: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  accent: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  hero: {
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

// ─── Layout Constants ────────────────────────────────────────────
export const layout = {
  sidebarWidth: 260,
  contentMaxWidth: 720,
  headerHeight: 56,
} as const;

// ─── Combined Theme Export ───────────────────────────────────────
export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  layout,
} as const;

export type Theme = typeof theme;

export default theme;
