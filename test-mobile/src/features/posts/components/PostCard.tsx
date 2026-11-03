import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/shared/components";
import { radii, spacing, useTheme } from "@/shared/theme";
import type { LikeResult, PostSummary } from "../posts.api";
import { formatPostDate } from "../utils/formatPostDate";
import { LikeButton } from "./LikeButton";

type PostCardProps = {
  post: PostSummary;
  full?: boolean;
  onPress?: () => void;
  onLikeChange?: (result: LikeResult) => void;
};

export function PostCard(props: PostCardProps) {
  const post = props.post;
  const colors = useTheme().colors;
  const excerpt = post.body.length > 220
    ? `${post.body.slice(0, 220).trimEnd()}…`
    : post.body;

  const content = (
    <>
      <AppText
        variant="caption"
        color="muted"
      >
        {post.authorUsername} · {formatPostDate(post.createdAt)}
      </AppText>

      <AppText
        accessibilityRole="header"
        style={styles.title}
      >
        {post.title}
      </AppText>

      <AppText
        numberOfLines={props.full ? undefined : 4}
        selectable={props.full}
      >
        {props.full ? post.body : excerpt}
      </AppText>
    </>
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
        },
      ]}
    >
      {props.onPress ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Lire « ${post.title} » de ${post.authorUsername}`}
          onPress={props.onPress}
          style={({ pressed }) => [
            styles.content,
            {
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          {content}
        </Pressable>
      ) : (
        <View
          style={styles.content}
        >
          {content}
        </View>
      )}

      <View
        style={styles.counters}
      >
        {props.onLikeChange ? (
          <LikeButton
            post={post}
            onChange={props.onLikeChange}
          />
        ) : (
          <AppText
            variant="caption"
            color="muted"
          >
            {post.likesCount} {post.likesCount > 1 ? "mentions J’aime" : "mention J’aime"}
          </AppText>
        )}

        <AppText
          variant="caption"
          color="muted"
        >
          {post.commentsCount} {post.commentsCount > 1 ? "commentaires" : "commentaire"}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  content: {
    gap: spacing.sm,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
  },
  counters: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
