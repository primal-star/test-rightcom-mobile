import { StyleSheet, View } from "react-native";
import { AppText } from "@/shared/components";
import { radii, spacing, useTheme } from "@/shared/theme";
import type { PostSummary } from "../posts.api";
import { formatPostDate } from "../utils/formatPostDate";

type PostCardProps = {
  post: PostSummary;
  full?: boolean;
};

export function PostCard(props: PostCardProps) {
  const post = props.post;
  const colors = useTheme().colors;
  const excerpt = post.body.length > 220
    ? `${post.body.slice(0, 220).trimEnd()}…`
    : post.body;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
        },
      ]}
    >
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

      <View
        style={styles.counters}
      >
        <AppText
          variant="caption"
          color="muted"
        >
          {post.likesCount} {post.likesCount > 1 ? "mentions J’aime" : "mention J’aime"}
        </AppText>

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
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
  },
  counters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
