import { useSession } from "@/features/auth/hooks/useSession";
import { useValidatedForm } from "@/shared/hooks/useValidatedForm";
import { createComment, type PostComment } from "../posts.api";
import { commentSchema } from "../comment.schema";
import { invalidatePosts } from "../posts.revision";

export function useCommentForm(
  postId: string,
  onCreated: (comment: PostComment) => void,
) {
  const {
    user,
    withSession,
  } = useSession();
  const form = useValidatedForm(commentSchema, {
    text: "",
  }, {
    errorMessage: "Votre commentaire n’a pas pu être envoyé. Veuillez réessayer.",
  });

  const submit = form.handleSubmit(async (values) => {
    if (!user) {
      throw new Error("Connectez-vous pour commenter.");
    }

    const saved = await withSession(() => createComment(postId, values.text));

    onCreated({
      ...saved,
      authorUsername: user.getUsername() ?? "Vous",
    });
    invalidatePosts();
    form.reset();
  });

  return {
    ...form,
    canComment: Boolean(user),
    submit,
  };
}
