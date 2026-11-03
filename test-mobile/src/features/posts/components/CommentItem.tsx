import { StyleSheet, View } from "react-native";
import { AppText } from "@/shared/components";
import { spacing, useTheme } from "@/shared/theme";
import type { PostComment } from "../posts.api";
import { formatPostDate } from "../utils/formatPostDate";

type CommentItemProps = {
  comment: PostComment;
};

export function CommentItem(props: CommentItemProps) {
  const comment = props.comment;
  const colors = useTheme().colors;

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.surface,
        },
      ]}
    >
      <AppText
        variant="caption"
        color="muted"
      >
        {comment.authorUsername} · {formatPostDate(comment.createdAt)}
      </AppText>

      <AppText
        selectable
      >
        {comment.text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
  },
});
