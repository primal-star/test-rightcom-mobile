import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/features/auth/hooks/useSession";
import { fetchPostsPage, POSTS_PAGE_SIZE, type PostSummary } from "../posts.api";

type LoadMode = "initial" | "refresh" | "more";

type FeedState = {
  posts: PostSummary[];
  phase: LoadMode | null;
  error: string | null;
  errorMode: LoadMode | null;
  hasMore: boolean;
};

export function useFeed() {
  const withSession = useSession().withSession;
  const [state, setState] = useState<FeedState>({
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
  const nextOffset = useRef(0);
  const hasMore = useRef(true);

  const loadPage = useCallback(async (
    mode: LoadMode,
    offset: number,
    requestVersion: number,
  ) => {
    try {
      const page = await withSession(() => fetchPostsPage(offset));

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
          phase: null,
          error: cause instanceof Error
            ? cause.message
            : "Impossible de charger les publications.",
          errorMode: mode,
        }));
      }
    } finally {
      if (version.current.value === requestVersion) {
        inFlight.current = false;
      }
    }
  }, [withSession]);

  useEffect(() => {
    const currentVersion = version.current;
    const requestVersion = ++version.current.value;

    inFlight.current = true;
    void loadPage("initial", 0, requestVersion);

    return () => {
      currentVersion.value++;
      inFlight.current = false;
    };
  }, [loadPage]);

  function refresh() {
    if (state.phase === "refresh") {
      return;
    }

    const requestVersion = ++version.current.value;

    inFlight.current = true;
    setState((previous) => ({
      ...previous,
      phase: "refresh",
      error: null,
      errorMode: null,
    }));

    void loadPage("refresh", 0, requestVersion);
  }

  function loadMore() {
    if (inFlight.current || !hasMore.current || state.error) {
      return;
    }

    const requestVersion = ++version.current.value;

    inFlight.current = true;
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
    setState((previous) => ({
      ...previous,
      phase: mode,
      error: null,
      errorMode: null,
    }));

    void loadPage(mode, offset, requestVersion);
  }

  return {
    ...state,
    refresh,
    loadMore,
    retry,
  };
}
