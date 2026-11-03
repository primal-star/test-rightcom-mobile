import { router, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useRef } from "react";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { AppText, Button, RequestState, Screen } from "@/shared/components";
import { spacing } from "@/shared/theme";
import { CommentItem } from "@/features/posts/components/CommentItem";
import { PostCard } from "@/features/posts/components/PostCard";
import { usePostDetail } from "@/features/posts/hooks/usePostDetail";
import { useDeletePost } from "@/features/posts/hooks/useDeletePost";
import { useCommentForm } from "@/features/posts/hooks/useCommentForm";
import { CommentComposer } from "@/features/posts/components/CommentComposer";
import type { PostComment } from "@/features/posts/posts.api";

export default function PostDetail() {
  const params = useLocalSearchParams<{
    postId: string;
  }>();
  const postId = typeof params.postId === "string" ? params.postId : "";
  const detail = usePostDetail(postId);
  const deletion = useDeletePost(detail.post);
  const headerHeight = useHeaderHeight();
  const list = useRef<FlatList<PostComment>>(null);
  const scrollToNewComment = useRef(false);
  const commentsOffset = useRef(0);
  const form = useCommentForm(postId, handleCommentCreated);

  function handleCommentCreated(comment: PostComment) {
    scrollToNewComment.current = true;
    detail.addComment(comment);
  }

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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={headerHeight}
        style={styles.layout}
      >
        <FlatList
          ref={list}
          style={styles.layout}
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
              onLayout={(event) => {
                commentsOffset.current = event.nativeEvent.layout.height + spacing.md;
              }}
            >
              <PostCard
                post={detail.post}
                full
                onLikeChange={detail.updateLike}
              />

              {deletion.canDelete && (
                <View
                  style={styles.actions}
                >
                  {deletion.error && (
                    <AppText
                      color="error"
                      accessibilityLiveRegion="polite"
                    >
                      {deletion.error}
                    </AppText>
                  )}

                  <Button
                    label="Supprimer ma publication"
                    variant="danger"
                    loading={deletion.isDeleting}
                    disabled={form.isSubmitting}
                    onPress={deletion.confirmDelete}
                  />
                </View>
              )}

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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onContentSizeChange={() => {
            if (scrollToNewComment.current) {
              scrollToNewComment.current = false;
              list.current?.scrollToOffset({
                offset: commentsOffset.current,
                animated: true,
              });
            }
          }}
        />

        <CommentComposer
          form={form}
          disabled={deletion.isDeleting}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingVertical: spacing.md,
  },
  header: {
    gap: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
  },
});
