import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppText, Button, FormField } from "@/shared/components";
import { spacing, useTheme } from "@/shared/theme";
import type { useCommentForm } from "../hooks/useCommentForm";

type CommentComposerProps = {
  form: ReturnType<typeof useCommentForm>;
  disabled?: boolean;
};

export function CommentComposer({
  form,
  disabled = false,
}: CommentComposerProps) {
  const colors = useTheme().colors;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.surface,
        },
      ]}
    >
      {form.canComment ? (
        <>
          <FormField
            form={form}
            name="text"
            label="Votre commentaire"
            placeholder="Participez à la discussion…"
            multiline
            autoCapitalize="sentences"
            editable={!disabled}
            style={styles.input}
          />

          <AppText
            variant="caption"
            color="muted"
          >
            {form.values.text.length} / 500 caractères
          </AppText>

          {form.error && (
            <AppText
              color="error"
              variant="caption"
              accessibilityLiveRegion="polite"
            >
              {form.error}
            </AppText>
          )}

          <Button
            label="Envoyer"
            loading={form.isSubmitting}
            disabled={disabled}
            onPress={() => void form.submit()}
          />
        </>
      ) : (
        <>
          <AppText
            color="muted"
          >
            Connectez-vous pour ajouter un commentaire.
          </AppText>

          <Button
            label="Se connecter"
            variant="secondary"
            onPress={() => router.push("/login")}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  input: {
    minHeight: 64,
    maxHeight: 120,
  },
});
