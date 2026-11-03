import { useState } from "react";
import {
  Pressable,
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
  secureTextEntry,
  editable = true,
  accessibilityLabel,
  accessibilityHint,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const colors = useTheme().colors;
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const hasPasswordToggle = secureTextEntry && !multiline;

  return (
    <View
      style={[styles.container, containerStyle]}
    >
      <AppText
        variant="caption"
        style={styles.label}
      >
        {label}
      </AppText>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : focused ? colors.primary : "transparent",
            opacity: editable ? 1 : 0.6,
          },
        ]}
      >
        <TextInput
          placeholderTextColor={colors.muted}
          selectionColor={colors.primary}
          underlineColorAndroid="transparent"
          {...props}
          multiline={multiline}
          editable={editable}
          secureTextEntry={hasPasswordToggle ? !passwordVisible : secureTextEntry}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={
            [accessibilityHint, error].filter(Boolean).join(". ") || undefined
          }
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            {
              color: colors.text,
            },
            multiline && styles.multiline,
            style,
          ]}
        />

        {hasPasswordToggle && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            accessibilityState={{
              disabled: !editable,
            }}
            disabled={!editable}
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={styles.passwordToggle}
          >
            <AppText
              variant="caption"
              style={{
                color: colors.primary,
              }}
            >
              {passwordVisible ? "Masquer" : "Afficher"}
            </AppText>
          </Pressable>
        )}
      </View>

      {error && (
        <AppText
          variant="caption"
          color="error"
          accessibilityLiveRegion="polite"
        >
          {error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.sm,
  },
  input: {
    ...typography.body,
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  passwordToggle: {
    minWidth: 76,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
});
