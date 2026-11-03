import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
} from "react-native";
import { radii, spacing, useTheme } from "@/shared/theme";
import { AppText } from "./AppText";

export type ButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
};

export function Button({
  label,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  accessibilityState,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();

  const blocked = disabled || loading;
  const backgroundColor =
    variant === "secondary" ? colors.surface : colors[variant];
  const color =
    variant === "secondary"
      ? colors.text
      : variant === "danger"
        ? colors.onDanger
        : colors.onPrimary;

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      disabled={blocked}
      accessibilityState={{
        ...accessibilityState,
        disabled: blocked,
        busy: loading,
      }}
      style={(state) => [
        styles.button,
        {
          backgroundColor,
          opacity: blocked ? 0.55 : state.pressed ? 0.8 : 1,
        },
        typeof style === "function" ? style(state) : style,
      ]}
    >
      {loading && (
        <ActivityIndicator
          color={color}
        />
      )}
      <AppText
        style={{
          color,
          fontWeight: "600",
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
