import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppText, Button, Screen } from "@/shared/components";
import { spacing } from "@/shared/theme";
import { useSession } from "@/features/auth/hooks/useSession";

export default function Feed() {
  const {
    user,
    isSigningOut,
    error,
    signOut,
  } = useSession();

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  return (
    <Screen
      edges={["left", "right", "bottom"]}
    >
      <View
        style={styles.content}
      >
        <AppText
          variant="title"
          accessibilityRole="header"
        >
          {user ? `Bienvenue, ${user.getUsername()}` : "Bienvenue"}
        </AppText>

        <AppText
          color="muted"
        >
          Le fil de publications sera disponible prochainement.
        </AppText>

        {error && (
          <AppText
            color="error"
            accessibilityLiveRegion="polite"
          >
            {error}
          </AppText>
        )}

        <Button
          label={user ? "Se déconnecter" : "Se connecter"}
          variant="secondary"
          loading={isSigningOut}
          onPress={user ? () => void handleSignOut() : () => router.replace("/login")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
});
