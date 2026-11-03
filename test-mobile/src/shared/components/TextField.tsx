import {
  TextInput,
  View,
  StyleSheet,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { radii, spacing, typography, useTheme } from "@/shared/theme";
import { AppText } from "./AppText";

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
};
export function TextField({
  label,
  error,
  containerStyle,
  style,
  multiline,

  accessibilityLabel,
  accessibilityHint,
  ...props
}: TextFieldProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.container, containerStyle]}
    >
      <AppText>{label}</AppText>
      <TextInput
        placeholderTextColor={colors.muted}
        selectionColor={colors.primary}
        underlineColorAndroid="transparent"
        {...props}
        multiline={multiline}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={
          [accessibilityHint, error].filter(Boolean).join(". ") || undefined
        }
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
          },
          multiline && styles.multiline,
          style,
        ]}
      />
      {error ? (
        <AppText
          variant="caption"
          color="error"
          accessibilityLiveRegion="polite"
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  input: {
    ...typography.body,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: "top",
  },
});
