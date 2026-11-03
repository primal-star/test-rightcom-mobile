import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/shared/theme";
import { useSession } from "../hooks/useSession";

export function LogoutButton() {
  const colors = useTheme().colors;
  const {
    isSigningOut,
    signOut,
  } = useSession();

  async function handlePress() {
    await signOut();
    router.replace("/");
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Se déconnecter"
      accessibilityState={{
        disabled: isSigningOut,
        busy: isSigningOut,
      }}
      disabled={isSigningOut}
      onPress={() => void handlePress()}
      style={({ pressed }) => [
        styles.button,
        {
          opacity: pressed || isSigningOut ? 0.5 : 1,
        },
      ]}
    >
      {isSigningOut ? (
        <ActivityIndicator
          color={colors.primary}
        />
      ) : (
        <SymbolView
          name={{
            ios: "rectangle.portrait.and.arrow.right",
            android: "logout",
            web: "logout",
          }}
          size={24}
          tintColor={colors.primary}
          accessible={false}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
