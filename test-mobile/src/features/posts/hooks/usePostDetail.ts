import { useCallback, useEffect, useRef, useState } from "react";
import { Parse } from "@/shared/lib/parse";
import { useSession } from "@/features/auth/hooks/useSession";
import { fetchPostDetail, type PostComment, type PostSummary } from "../posts.api";

type DetailState = {
  postId: string;
  post: PostSummary | null;
  comments: PostComment[];
  loading: boolean;
  error: string | null;
  notFound: boolean;
};

export function usePostDetail(postId: string) {
  const withSession = useSession().withSession;
  const [state, setState] = useState<DetailState>({
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

      const result = await withSession(() => fetchPostDetail(postId));

      if (version.current.value === requestVersion) {
        setState({
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
          postId,
          post: null,
          comments: [],
          loading: false,
          error: notFound
            ? "Cette publication n’existe plus ou n’est pas accessible."
            : cause instanceof Error
              ? cause.message
              : "Impossible de charger la publication.",
          notFound,
        });
      }
    } finally {
      if (version.current.value === requestVersion) {
        pending.current = false;
      }
    }
  }, [postId, withSession]);

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

  return {
    ...state,
    loading: state.postId !== postId || state.loading,
    retry,
    addComment,
  };
}
