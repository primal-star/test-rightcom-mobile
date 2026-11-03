import { router, usePathname } from "expo-router";
import { useRef, useState } from "react";
import { Alert } from "react-native";
import { useSession } from "@/features/auth/hooks/useSession";
import { togglePostLike, type LikeResult } from "../posts.api";
import { invalidatePosts } from "../posts.revision";
import { getRequestErrorMessage } from "@/shared/utils/getRequestErrorMessage";
import { useToast } from "@/shared/hooks/useToast";

export function useToggleLike(
  postId: string,
  onChange: (result: LikeResult) => void,
) {
  const {
    user,
    withSession,
  } = useSession();
  const [loading, setLoading] = useState(false);
  const showToast = useToast();
  const pending = useRef(false);
  const confirming = useRef(false);
  const pathname = usePathname();

  async function toggle() {
    if (!user) {
      if (confirming.current) {
        return;
      }

      confirming.current = true;

      Alert.alert(
        "Connexion requise",
        "Vous devez être connecté pour aimer une publication.",
        [
          {
            text: "Annuler",
            style: "cancel",
            onPress: () => {
              confirming.current = false;
            },
          },
          {
            text: "Se connecter",
            onPress: () => {
              confirming.current = false;
              router.push({
                pathname: "/login",
                params: {
                  returnTo: pathname,
                },
              });
            },
          },
        ],
        {
          cancelable: true,
          onDismiss: () => {
            confirming.current = false;
          },
        },
      );

      return;
    }

    if (pending.current) {
      return;
    }

    pending.current = true;
    setLoading(true);

    try {
      const result = await withSession(() => togglePostLike(postId));

      invalidatePosts();
      onChange(result);
    } catch (cause) {
      const message = getRequestErrorMessage(cause, "Votre mention J’aime n’a pas pu être modifiée. Veuillez réessayer.");

      if (message) {
        showToast(message);
      }
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }

  return {
    loading,
    toggle,
  };
}
