import { useColorScheme } from "react-native";

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
};

export const typography = {
  title: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "700" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    lineHeight: 20,
  },
};

export const palettes = {
  light: {
    background: "#FFFFFF",
    surface: "#F3F4F6",
    text: "#111827",
    muted: "#4B5563",
    border: "#6B7280",
    primary: "#1D4ED8",
    danger: "#B91C1C",
    onPrimary: "#FFFFFF",
    onDanger: "#FFFFFF",
  },
  dark: {
    background: "#111827",
    surface: "#1F2937",
    text: "#F9FAFB",
    muted: "#D1D5DB",
    border: "#9CA3AF",
    primary: "#93C5FD",
    danger: "#FCA5A5",
    onPrimary: "#111827",
    onDanger: "#111827",
  },
};

export function useTheme() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  return {
    colors: palettes[scheme],
    scheme,
    spacing,
    radii,
    typography,
  };
}
