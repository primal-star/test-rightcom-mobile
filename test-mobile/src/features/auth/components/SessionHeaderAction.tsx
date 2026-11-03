import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { AppText } from "@/shared/components";
import { spacing, useTheme } from "@/shared/theme";
import { useSession } from "../hooks/useSession";
import { LogoutButton } from "./LogoutButton";

export function SessionHeaderAction() {
  const user = useSession().user;
  const colors = useTheme().colors;
  const pathname = usePathname();

  if (user) {
    return <LogoutButton />;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Se connecter"
      onPress={() => router.push({
        pathname: "/login",
        params: {
          returnTo: pathname,
        },
      })}
      style={({ pressed }) => [
        styles.button,
        {
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <AppText
        variant="caption"
        style={{
          color: colors.primary,
          fontWeight: "600",
        }}
      >
        Se connecter
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
});
