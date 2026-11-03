import { useCallback, useEffect, useRef, useState } from "react";
import { Parse } from "@/shared/lib/parse";
import { getRequestErrorMessage } from "@/shared/utils/getRequestErrorMessage";
import { useSession } from "@/features/auth/hooks/useSession";
import { fetchPostDetail, type LikeResult, type PostComment, type PostSummary } from "../posts.api";

type DetailState = {
  userId: string | null;
  postId: string;
  post: PostSummary | null;
  comments: PostComment[];
  loading: boolean;
  error: string | null;
  notFound: boolean;
};

export function usePostDetail(postId: string) {
  const {
    user,
    withSession,
  } = useSession();
  const userId = user?.id ?? null;
  const [state, setState] = useState<DetailState>({
    userId,
    postId,
    post: null,
    comments: [],
    loading: true,
    error: null,
    notFound: false,
  });
  const version = useRef({
    value: 0,
  });
  const pending = useRef(false);

  const load = useCallback(async (requestVersion: number) => {
    try {
      if (!postId) {
        throw new Error("L’identifiant de la publication est manquant.");
      }

      const result = await withSession(() => fetchPostDetail(postId, user));

      if (version.current.value === requestVersion) {
        setState({
          userId,
          postId,
          ...result,
          loading: false,
          error: null,
          notFound: false,
        });
      }
    } catch (cause) {
      if (version.current.value === requestVersion) {
        const notFound = cause instanceof Parse.Error
          && cause.code === Parse.Error.OBJECT_NOT_FOUND;

        setState({
          userId,
          postId,
          post: null,
          comments: [],
          loading: false,
          error: notFound
            ? "Cette publication n’existe plus ou n’est pas accessible."
            : getRequestErrorMessage(cause, "Impossible de charger la publication."),
          notFound,
        });
      }
    } finally {
      if (version.current.value === requestVersion) {
        pending.current = false;
      }
    }
  }, [postId, user, userId, withSession]);

  useEffect(() => {
    const currentVersion = version.current;
    const requestVersion = ++currentVersion.value;

    pending.current = true;
    void load(requestVersion);

    return () => {
      currentVersion.value++;
      pending.current = false;
    };
  }, [load]);

  function retry() {
    if (pending.current) {
      return;
    }

    pending.current = true;
    setState((previous) => ({
      ...previous,
      loading: true,
      error: null,
    }));

    void load(++version.current.value);
  }

  function addComment(comment: PostComment) {
    setState((previous) => {
      if (
        previous.post?.id !== postId
        || previous.comments.some((item) => item.id === comment.id)
      ) {
        return previous;
      }

      const comments = [...previous.comments, comment].sort((first, second) => {
        const difference = second.createdAt.getTime() - first.createdAt.getTime();

        return difference || second.id.localeCompare(first.id);
      });

      return {
        ...previous,
        comments,
        post: {
          ...previous.post,
          commentsCount: previous.post.commentsCount + 1,
        },
      };
    });
  }

  function updateLike(result: LikeResult) {
    setState((previous) => {
      if (previous.post?.id !== postId || previous.userId !== userId) {
        return previous;
      }

      return {
        ...previous,
        post: {
          ...previous.post,
          likedByMe: result.liked,
          likesCount: result.likesCount,
        },
      };
    });
  }

  return {
    ...state,
    loading: state.postId !== postId || state.userId !== userId || state.loading,
    retry,
    addComment,
    updateLike,
  };
}
