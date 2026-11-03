import { router } from "expo-router";
import { useRef, useState } from "react";
import { Alert } from "react-native";
import { useSession } from "@/features/auth/hooks/useSession";
import { deletePost, type PostSummary } from "../posts.api";
import { invalidatePosts } from "../posts.revision";
import { getRequestErrorMessage } from "@/shared/utils/getRequestErrorMessage";
import { useToast } from "@/shared/hooks/useToast";

export function useDeletePost(post: PostSummary | null) {
  const {
    user,
    withSession,
  } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);
  const showToast = useToast();
  const deleting = useRef(false);
  const confirming = useRef(false);
  const canDelete = Boolean(user && post && user.id === post.authorId);

  async function remove() {
    confirming.current = false;

    if (!canDelete || !post || deleting.current) {
      return;
    }

    deleting.current = true;
    setIsDeleting(true);

    try {
      await withSession(() => deletePost(post.id));
      invalidatePosts();
      router.dismissTo("/feed");
    } catch (cause) {
      const message = getRequestErrorMessage(cause, "La publication n’a pas pu être supprimée. Veuillez réessayer.");

      if (message) {
        showToast(message);
      }
    } finally {
      deleting.current = false;
      setIsDeleting(false);
    }
  }

  function confirmDelete() {
    if (!canDelete || confirming.current || deleting.current) {
      return;
    }

    confirming.current = true;

    Alert.alert(
      "Supprimer cette publication ?",
      "La publication, ses commentaires et ses mentions J’aime seront supprimés.",
      [
        {
          text: "Annuler",
          style: "cancel",
          onPress: () => {
            confirming.current = false;
          },
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => void remove(),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          confirming.current = false;
        },
      },
    );
  }

  return {
    canDelete,
    isDeleting,
    confirmDelete,
  };
}
