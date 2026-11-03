import { router } from "expo-router";
import { useSession } from "@/features/auth/hooks/useSession";
import { useValidatedForm } from "@/shared/hooks/useValidatedForm";
import { createPost } from "../posts.api";
import { postSchema } from "../post.schema";
import { invalidatePosts } from "../posts.revision";

export function useCreatePost() {
  const {
    user,
    withSession,
  } = useSession();
  const form = useValidatedForm(postSchema, {
    title: "",
    body: "",
  });

  const submit = form.handleSubmit(async (values) => {
    if (!user) {
      throw new Error("Connectez-vous pour publier.");
    }

    await withSession(() => createPost(values));
    invalidatePosts();
    form.reset();
    router.navigate("/feed");
  });

  return {
    ...form,
    submit,
  };
}
