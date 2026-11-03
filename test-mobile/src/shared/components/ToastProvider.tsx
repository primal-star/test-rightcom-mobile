import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ToastContext } from "../contexts/ToastContext";
import { radii, spacing, useTheme } from "../theme";
import { AppText } from "./AppText";

export function ToastProvider(props: PropsWithChildren) {
  const [toast, setToast] = useState<{
    message: string;
    id: number;
  } | null>(null);
  const sequence = useRef(0);
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();

  const showToast = useCallback((text: string) => {
    if (!text.trim()) {
      return;
    }

    setToast({
      message: text,
      id: ++sequence.current,
    });
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = setTimeout(() => setToast(null), 4000);

    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider
      value={showToast}
    >
      <View
        style={styles.container}
      >
        {props.children}

        {toast && (
          <View
            pointerEvents="none"
            accessible
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[
              styles.toast,
              {
                bottom: insets.bottom + 64,
                backgroundColor: colors.text,
              },
            ]}
          >
            <AppText
              style={{
                color: colors.background,
                textAlign: "center",
              }}
            >
              {toast.message}
            </AppText>
          </View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toast: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    zIndex: 1000,
    elevation: 8,
  },
});
