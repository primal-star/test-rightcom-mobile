import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/shared/components";
import { spacing, useTheme } from "@/shared/theme";
import { useToggleLike } from "../hooks/useToggleLike";
import type { LikeResult, PostSummary } from "../posts.api";

type LikeButtonProps = {
  post: PostSummary;
  onChange: (result: LikeResult) => void;
};

export function LikeButton({
  post,
  onChange,
}: LikeButtonProps) {
  const colors = useTheme().colors;
  const action = useToggleLike(post.id, onChange);
  const color = post.likedByMe ? colors.primary : colors.muted;

  return (
    <View
      style={styles.container}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${post.likedByMe ? "Retirer ma mention J’aime" : "Aimer cette publication"}. ${post.likesCount} mentions J’aime.`}
        accessibilityState={{
          selected: post.likedByMe,
          disabled: action.loading,
          busy: action.loading,
        }}
        disabled={action.loading}
        onPress={() => void action.toggle()}
        style={({ pressed }) => [
          styles.button,
          {
            opacity: pressed || action.loading ? 0.6 : 1,
          },
        ]}
      >
        {action.loading ? (
          <ActivityIndicator
            color={color}
            size="small"
          />
        ) : (
          <SymbolView
            name={{
              ios: post.likedByMe ? "heart.fill" : "heart",
              android: post.likedByMe ? "favorite" : "favorite_border",
              web: post.likedByMe ? "favorite" : "favorite_border",
            }}
            size={20}
            tintColor={color}
            accessible={false}
          />
        )}

        <AppText
          variant="caption"
          style={{
            color,
            fontWeight: "600",
          }}
        >
          {post.likesCount} · {post.likedByMe ? "Aimé" : "J’aime"}
        </AppText>
      </Pressable>

      {action.error && (
        <AppText
          variant="caption"
          color="error"
          accessibilityLiveRegion="polite"
        >
          {action.error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    flexShrink: 1,
  },
  button: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
});
