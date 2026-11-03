import { Parse } from "@/shared/lib/parse";
import { useValidatedForm } from "@/shared/hooks/useValidatedForm";
import { loginSchema, signupSchema } from "../auth.schemas";
import { useSession } from "./useSession";
import { UserFacingError } from "@/shared/utils/UserFacingError";

export type AuthMode = "login" | "signup";

export function useAuthForm(mode: AuthMode) {
  const refreshSession = useSession().refreshSession;
  const schema = mode === "signup" ? signupSchema : loginSchema;
  const form = useValidatedForm(schema, {
    username: "",
    password: "",
    email: "",
  }, {
    errorMessage: mode === "login"
      ? "La connexion n’a pas abouti. Veuillez réessayer."
      : "Votre compte n’a pas pu être créé. Veuillez réessayer.",
  });

  const submit = form.handleSubmit(async (values) => {
    if (mode === "signup") {
      const account = new Parse.User();

      account.setUsername(values.username);
      account.setPassword(values.password);

      if (values.email) {
        account.setEmail(values.email);
      }

      await account.signUp();
    } else {
      try {
        await Parse.User.logIn(values.username, values.password, {
          usePost: true,
        });
      } catch (cause) {
        if (cause instanceof Parse.Error && cause.code === Parse.Error.OBJECT_NOT_FOUND) {
          throw new UserFacingError("Le nom d’utilisateur ou le mot de passe est incorrect.");
        }

        throw cause;
      }
    }

    await refreshSession();
  });

  return {
    ...form,
    submit,
  };
}
