import { router, usePathname } from "expo-router";
import { useRef, useState } from "react";
import { useSession } from "@/features/auth/hooks/useSession";
import { togglePostLike, type LikeResult } from "../posts.api";
import { invalidatePosts } from "../posts.revision";

export function useToggleLike(
  postId: string,
  onChange: (result: LikeResult) => void,
) {
  const {
    user,
    withSession,
  } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const pathname = usePathname();

  async function toggle() {
    if (!user) {
      router.push({
        pathname: "/login",
        params: {
          returnTo: pathname,
        },
      });

      return;
    }

    if (pending.current) {
      return;
    }

    pending.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await withSession(() => togglePostLike(postId));

      invalidatePosts();
      onChange(result);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible de modifier votre mention J’aime.",
      );
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    toggle,
  };
}
