import { Redirect, router } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { AppText, Button, FormField, Screen } from "@/shared/components";
import { spacing } from "@/shared/theme";
import { useSession } from "@/features/auth/hooks/useSession";
import { useCreatePost } from "../hooks/useCreatePost";

export function CreatePostScreen() {
  const user = useSession().user;
  const form = useCreatePost();

  if (!user) {
    return (
      <Redirect
        href={{
          pathname: "/login",
          params: {
            returnTo: "/publish",
          },
        }}
      />
    );
  }

  return (
    <Screen
      edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <AppText
            variant="title"
            accessibilityRole="header"
          >
            Nouvelle publication
          </AppText>

          <AppText
            color="muted"
          >
            Partagez une idée ou lancez une discussion.
          </AppText>

          <FormField
            form={form}
            name="title"
            label="Titre"
            placeholder="Le sujet de votre publication"
            autoCapitalize="sentences"
          />

          <AppText
            variant="caption"
            color="muted"
          >
            De 3 à 120 caractères.
          </AppText>

          <FormField
            form={form}
            name="body"
            label="Contenu"
            placeholder="Que souhaitez-vous partager ?"
            multiline
            autoCapitalize="sentences"
            style={styles.body}
          />

          <AppText
            variant="caption"
            color="muted"
          >
            {form.values.body.length} / 5 000 caractères
          </AppText>

          {form.error && (
            <AppText
              color="error"
              accessibilityLiveRegion="polite"
            >
              {form.error}
            </AppText>
          )}

          <Button
            label="Publier"
            loading={form.isSubmitting}
            onPress={() => void form.submit()}
          />

          <Button
            label="Annuler"
            variant="secondary"
            disabled={form.isSubmitting}
            onPress={() => {
              form.reset();
              router.navigate("/feed");
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  body: {
    minHeight: 220,
  },
});
