import { useState } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import {
  AppText,
  Button,
  RequestState,
  Screen,
  TextField,
} from "@/shared/components";
import { spacing } from "@/shared/theme";

export default function Index() {
  const [presses, setPresses] = useState(0);
  const [retries, setRetries] = useState(0);
  
  const onPress = () => setPresses((value) => value + 1);

  return (
    <Screen
      edges={["left", "right", "bottom"]}
    >
      {/* Temporary showcase, to be replaced by the feed. */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View
          style={styles.section}
        >
          <AppText
            variant="title"
            accessibilityRole="header"
          >
            Primitives du blog
          </AppText>
          <AppText>Un socle commun pour les écrans du MUST.</AppText>
          <AppText
            variant="caption"
            color="muted"
          >
            Le thème suit le réglage de votre appareil.
          </AppText>
          <AppText
            color="error"
          >Exemple de message d’erreur.</AppText>
        </View>
        <View
          style={styles.section}
        >
          <AppText
            variant="title"
            accessibilityRole="header"
          >
            Boutons
          </AppText>
          <Button
            label="Action principale"
            onPress={onPress}
          />
          <Button
            label="Action secondaire"
            variant="secondary"
            onPress={onPress}
          />
          <Button
            label="Action destructive"
            variant="danger"
            onPress={onPress}
          />
          <Button
            label="Désactivé"
            disabled
            onPress={onPress}
          />
          <Button
            label="En cours"
            loading
            onPress={onPress}
          />
          <AppText
            variant="caption"
            accessibilityLiveRegion="polite"
          >
            Actions déclenchées : {presses}
          </AppText>
        </View>
        <View
          style={styles.section}
        >
          <AppText
            variant="title"
            accessibilityRole="header"
          >
            Champs
          </AppText>
          <TextField
            label="Nom d’utilisateur"
            placeholder="alice"
            autoCapitalize="none"
          />
          <TextField
            label="Adresse e-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="alice@example.com"
          />
          <TextField
            label="Mot de passe"
            secureTextEntry
            autoCapitalize="none"
          />
          <TextField
            label="Contenu"
            multiline
            placeholder="Écrivez votre publication…"
          />
          <TextField
            label="Titre"
            defaultValue="Hi"
            error="Le titre doit contenir au moins 3 caractères."
          />
        </View>
        <View
          style={styles.section}
        >
          <AppText
            variant="title"
            accessibilityRole="header"
          >
            États de contenu
          </AppText>
          <RequestState
            status="loading"
          />
          <RequestState
            status="empty"
            message="Aucune publication pour le moment."
          />
          <RequestState
            status="error"
            onRetry={() => setRetries((value) => value + 1)}
          />
          <AppText
            variant="caption"
            accessibilityLiveRegion="polite"
          >
            Nouvelles tentatives : {retries}
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.lg,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
});
