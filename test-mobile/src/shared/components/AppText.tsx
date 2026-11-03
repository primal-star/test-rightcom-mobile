import { Text, type TextProps } from "react-native";
import { typography, useTheme } from "@/shared/theme";

export type AppTextProps = TextProps & {
  variant?: keyof typeof typography;
  color?: "default" | "muted" | "error";
};

export function AppText({
  variant = "body",
  color = "default",
  style,
  accessibilityRole,
  accessibilityLiveRegion,
  ...props
}: AppTextProps) {
  const { colors } = useTheme();
  const textColor =
    color === "error"
      ? colors.danger
      : color === "muted"
        ? colors.muted
        : colors.text;

  return (
    <Text
      {...props}
      accessibilityRole={accessibilityRole ?? (color === "error" ? "alert" : undefined)}
      accessibilityLiveRegion={accessibilityLiveRegion ?? (color === "error" ? "polite" : undefined)}
      style={[
        typography[variant],
        {
          color: textColor,
        },
        style,
      ]}
    />
  );
}
