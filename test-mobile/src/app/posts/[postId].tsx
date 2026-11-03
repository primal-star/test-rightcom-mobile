import { router, useLocalSearchParams } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";
import { AppText, Button, RequestState, Screen } from "@/shared/components";
import { spacing } from "@/shared/theme";
import { CommentItem } from "@/features/posts/components/CommentItem";
import { PostCard } from "@/features/posts/components/PostCard";
import { usePostDetail } from "@/features/posts/hooks/usePostDetail";

export default function PostDetail() {
  const params = useLocalSearchParams<{
    postId: string;
  }>();
  const postId = typeof params.postId === "string" ? params.postId : "";
  const detail = usePostDetail(postId);

  if (detail.loading || !detail.post) {
    return (
      <Screen
        edges={["left", "right", "bottom"]}
      >
        <RequestState
          status={detail.loading ? "loading" : "error"}
          message={detail.loading ? "Chargement de la publication…" : detail.error ?? undefined}
          onRetry={detail.notFound ? undefined : detail.retry}
        />

        {detail.notFound && (
          <Button
            label="Retour aux publications"
            variant="secondary"
            onPress={() => router.replace("/feed")}
          />
        )}
      </Screen>
    );
  }

  return (
    <Screen
      edges={["left", "right", "bottom"]}
    >
      <FlatList
        data={detail.comments}
        keyExtractor={(comment) => comment.id}
        renderItem={({ item }) => (
          <CommentItem
            comment={item}
          />
        )}
        ListHeaderComponent={
          <View
            style={styles.header}
          >
            <PostCard
              post={detail.post}
              full
            />

            <AppText
              variant="title"
              accessibilityRole="header"
            >
              Commentaires
            </AppText>
          </View>
        }
        ListEmptyComponent={
          <RequestState
            status="empty"
            message="Aucun commentaire pour le moment."
          />
        }
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingVertical: spacing.md,
  },
  header: {
    gap: spacing.lg,
  },
});
