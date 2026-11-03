import { Parse } from "@/shared/lib/parse";
import { useValidatedForm } from "@/shared/hooks/useValidatedForm";
import { loginSchema, signupSchema } from "../auth.schemas";
import { useSession } from "./useSession";

export type AuthMode = "login" | "signup";

export function useAuthForm(mode: AuthMode) {
  const refreshSession = useSession().refreshSession;
  const schema = mode === "signup" ? signupSchema : loginSchema;
  const form = useValidatedForm(schema, {
    username: "",
    password: "",
    email: "",
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
      await Parse.User.logIn(values.username, values.password, {
        usePost: true,
      });
    }

    await refreshSession();
  });

  return {
    ...form,
    submit,
  };
}
