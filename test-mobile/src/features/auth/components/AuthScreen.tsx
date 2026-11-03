import { Redirect, router } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { AppText, Button, FormField, Screen } from "@/shared/components";
import { spacing, useTheme } from "@/shared/theme";
import { useAuthForm, type AuthMode } from "../hooks/useAuthForm";
import { useSession } from "../hooks/useSession";

type AuthScreenProps = {
  mode: AuthMode;
};

export function AuthScreen(props: AuthScreenProps) {
  const mode = props.mode;
  const user = useSession().user;
  const colors = useTheme().colors;
  const form = useAuthForm(mode);
  const isSignup = mode === "signup";

  if (user) {
    return (
      <Redirect
        href="/feed"
      />
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View
            style={styles.header}
          >
            <AppText
              variant="title"
              accessibilityRole="header"
              style={styles.centeredText}
            >
              {isSignup ? "Inscription" : "Connexion"}
            </AppText>

            <AppText
              color="muted"
              style={styles.subtitle}
            >
              {isSignup
                ? "Rejoignez les échanges et partagez vos idées."
                : "Heureux de vous retrouver parmi nous."}
            </AppText>
          </View>

          <View
            style={styles.form}
          >
            <FormField
              form={form}
              name="username"
              label="Nom d’utilisateur"
              placeholder="Votre nom d’utilisateur"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={isSignup ? "username-new" : "username"}
            />

            {isSignup && (
              <FormField
                form={form}
                name="email"
                label="Adresse e-mail (facultative)"
                placeholder="vous@exemple.fr"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            )}

            <FormField
              form={form}
              name="password"
              label="Mot de passe"
              placeholder="Votre mot de passe"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={isSignup ? "new-password" : "current-password"}
              returnKeyType="done"
              onSubmitEditing={() => void form.submit()}
            />

            {form.error && (
              <AppText
                color="error"
                accessibilityLiveRegion="polite"
              >
                {form.error}
              </AppText>
            )}

            <Button
              label={isSignup ? "Créer mon compte" : "Se connecter"}
              loading={form.isSubmitting}
              onPress={() => void form.submit()}
              style={styles.submit}
            />
          </View>

          <View
            style={styles.accountPrompt}
          >
            <AppText
              variant="caption"
              color="muted"
            >
              {isSignup ? "Vous avez déjà un compte ?" : "Pas encore de compte ?"}
            </AppText>

            <Pressable
              accessibilityRole="link"
              accessibilityState={{
                disabled: form.isSubmitting,
              }}
              disabled={form.isSubmitting}
              onPress={() => router.replace(isSignup ? "/login" : "/signup")}
              style={styles.link}
            >
              <AppText
                variant="caption"
                style={[
                  styles.linkText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                {isSignup ? "Se connecter" : "S’inscrire"}
              </AppText>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="link"
            accessibilityState={{
              disabled: form.isSubmitting,
            }}
            disabled={form.isSubmitting}
            onPress={() => router.replace("/feed")}
            style={styles.guestLink}
          >
            <AppText
              variant="caption"
              color="muted"
              style={styles.linkText}
            >
              Continuer sans connexion
            </AppText>
          </Pressable>
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
    maxWidth: 440,
    alignSelf: "center",
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  header: {
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl + spacing.md,
  },
  centeredText: {
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  form: {
    gap: spacing.lg,
  },
  submit: {
    marginTop: spacing.sm,
  },
  accountPrompt: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    columnGap: spacing.xs,
    marginTop: spacing.lg,
  },
  link: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  linkText: {
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  guestLink: {
    minHeight: 44,
    marginTop: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
