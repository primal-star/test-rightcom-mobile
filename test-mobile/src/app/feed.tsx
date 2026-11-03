import { Stack, router } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";
import { AppText, Button, RequestState, Screen } from "@/shared/components";
import { spacing } from "@/shared/theme";
import { useSession } from "@/features/auth/hooks/useSession";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { PostCard } from "@/features/posts/components/PostCard";
import { useFeed } from "@/features/posts/hooks/useFeed";

export default function Feed() {
  const {
    user,
    error: sessionError,
  } = useSession();
  const feed = useFeed();

  const header = (
    <View
      style={styles.header}
    >
      <AppText
        variant="title"
        accessibilityRole="header"
      >
        Les dernières publications
      </AppText>

      <AppText
        color="muted"
      >
        {user ? `Bonjour, ${user.getUsername()}` : "Découvrez les échanges de la communauté."}
      </AppText>

      {sessionError && (
        <AppText
          color="error"
          accessibilityLiveRegion="polite"
        >
          {sessionError}
        </AppText>
      )}

      {!user && (
        <Button
          label="Se connecter"
          variant="secondary"
          onPress={() => router.replace("/login")}
        />
      )}
    </View>
  );

  return (
    <Screen
      edges={["left", "right", "bottom"]}
    >
      <Stack.Screen
        options={{
          headerRight: () => user ? <LogoutButton /> : null,
        }}
      />

      <FlatList
        data={feed.posts}
        keyExtractor={(post) => post.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <RequestState
            status={feed.phase ? "loading" : feed.error ? "error" : "empty"}
            message={feed.error ?? (feed.phase ? "Chargement des publications…" : "Aucune publication pour le moment.")}
            onRetry={feed.retry}
          />
        }
        ListFooterComponent={feed.posts.length > 0 ? (
          feed.error ? (
            <RequestState
              status="error"
              message={feed.error}
              onRetry={feed.retry}
            />
          ) : feed.phase === "more" ? (
            <RequestState
              status="loading"
              message="Chargement de la suite…"
            />
          ) : !feed.hasMore ? (
            <AppText
              variant="caption"
              color="muted"
              style={styles.endMessage}
            >
              Vous avez vu toutes les publications.
            </AppText>
          ) : <></>
        ) : undefined}
        contentContainerStyle={styles.content}
        refreshing={feed.phase === "refresh"}
        onRefresh={feed.refresh}
        onEndReached={feed.loadMore}
        onEndReachedThreshold={0.4}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  header: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  endMessage: {
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});
