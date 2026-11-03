import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useSession } from "@/features/auth/hooks/useSession";
import { fetchPostsPage, POSTS_PAGE_SIZE, type LikeResult, type PostSummary } from "../posts.api";
import { getPostsRevision } from "../posts.revision";
import { getRequestErrorMessage } from "@/shared/utils/getRequestErrorMessage";

type LoadMode = "initial" | "refresh" | "more";

type FeedState = {
  userId: string | null;
  posts: PostSummary[];
  phase: LoadMode | null;
  error: string | null;
  errorMode: LoadMode | null;
  hasMore: boolean;
};

export function useFeed() {
  const {
    user,
    withSession,
  } = useSession();
  const userId = user?.id ?? null;
  const [state, setState] = useState<FeedState>({
    userId,
    posts: [],
    phase: "initial",
    error: null,
    errorMode: null,
    hasMore: true,
  });
  const version = useRef({
    value: 0,
  });
  const inFlight = useRef(false);
  const activeMode = useRef<LoadMode | null>("initial");
  const nextOffset = useRef(0);
  const hasMore = useRef(true);
  const observedRevision = useRef(getPostsRevision());

  const loadPage = useCallback(async (
    mode: LoadMode,
    offset: number,
    requestVersion: number,
  ) => {
    try {
      const page = await withSession(() => fetchPostsPage(offset, user));

      if (version.current.value !== requestVersion) {
        return;
      }

      nextOffset.current = offset + page.length;
      const pageHasMore = page.length === POSTS_PAGE_SIZE;

      hasMore.current = pageHasMore;

      setState((previous) => {
        const combined = mode === "more" ? [...previous.posts, ...page] : page;
        const uniquePosts = Array.from(new Map(
          combined.map((post) => [post.id, post]),
        ).values());

        return {
          userId,
          posts: uniquePosts,
          phase: null,
          error: null,
          errorMode: null,
          hasMore: pageHasMore,
        };
      });
    } catch (cause) {
      if (version.current.value === requestVersion) {
        setState((previous) => ({
          ...previous,
          userId,
          posts: previous.userId === userId ? previous.posts : [],
          phase: null,
          error: getRequestErrorMessage(cause, "Impossible de charger les publications."),
          errorMode: mode,
        }));
      }
    } finally {
      if (version.current.value === requestVersion) {
        inFlight.current = false;
        activeMode.current = null;
      }
    }
  }, [user, userId, withSession]);

  useEffect(() => {
    const currentVersion = version.current;
    const requestVersion = ++version.current.value;

    inFlight.current = true;
    activeMode.current = "initial";
    void loadPage("initial", 0, requestVersion);

    return () => {
      currentVersion.value++;
      inFlight.current = false;
      activeMode.current = null;
    };
  }, [loadPage]);

  const refresh = useCallback(() => {
    if (activeMode.current === "refresh") {
      return;
    }

    const requestVersion = ++version.current.value;

    inFlight.current = true;
    activeMode.current = "refresh";
    setState((previous) => ({
      ...previous,
      phase: "refresh",
      error: null,
      errorMode: null,
    }));

    void loadPage("refresh", 0, requestVersion);
  }, [loadPage]);

  useFocusEffect(useCallback(() => {
    const currentRevision = getPostsRevision();

    if (currentRevision !== observedRevision.current) {
      observedRevision.current = currentRevision;
      refresh();
    }
  }, [refresh]));

  function loadMore() {
    if (inFlight.current || !hasMore.current || state.error) {
      return;
    }

    const requestVersion = ++version.current.value;

    inFlight.current = true;
    activeMode.current = "more";
    setState((previous) => ({
      ...previous,
      phase: "more",
    }));

    void loadPage("more", nextOffset.current, requestVersion);
  }

  function retry() {
    if (inFlight.current) {
      return;
    }

    const mode = state.errorMode ?? "initial";
    const offset = mode === "more" ? nextOffset.current : 0;
    const requestVersion = ++version.current.value;

    inFlight.current = true;
    activeMode.current = mode;
    setState((previous) => ({
      ...previous,
      phase: mode,
      error: null,
      errorMode: null,
    }));

    void loadPage(mode, offset, requestVersion);
  }

  function updateLike(postId: string, result: LikeResult) {
    observedRevision.current = getPostsRevision();

    setState((previous) => ({
      ...previous,
      posts: previous.userId === userId ? previous.posts.map((post) => (
        post.id === postId ? {
          ...post,
          likedByMe: result.liked,
          likesCount: result.likesCount,
        } : post
      )) : previous.posts,
    }));
  }

  return {
    ...state,
    posts: state.userId === userId ? state.posts : [],
    phase: state.userId === userId ? state.phase : "initial" as const,
    error: state.userId === userId ? state.error : null,
    refresh,
    loadMore,
    retry,
    updateLike,
  };
}
