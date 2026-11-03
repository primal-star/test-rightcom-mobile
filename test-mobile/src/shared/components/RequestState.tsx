import {
  ActivityIndicator,
  View,
  StyleSheet,
  type ViewProps,
} from "react-native";
import { spacing, useTheme } from "@/shared/theme";
import { AppText } from "./AppText";
import { Button } from "./Button";

export type RequestStateProps = Omit<ViewProps, "children"> & {
  status: "loading" | "empty" | "error";
  message?: string;
  onRetry?: () => void;
};

const messages = {
  loading: "Chargement…",
  empty: "Aucun résultat.",
  error: "Impossible de charger les données.",
};

export function RequestState({
  status,
  message,
  onRetry,
  style,
  ...props
}: RequestStateProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityLiveRegion="polite"
      {...props}
      style={[styles.container, style]}
    >
      {status === "loading" && (
        <ActivityIndicator
          color={colors.primary}
          accessibilityLabel={message ?? messages.loading}
        />
      )}

      <AppText
        color={status === "error" ? "error" : "muted"}
        style={styles.message}
      >
        {message ?? messages[status]}
      </AppText>

      {status === "error" && onRetry && (
        <Button
          label="Réessayer"
          variant="secondary"
          onPress={onRetry}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  message: {
    textAlign: "center",
  },
});
