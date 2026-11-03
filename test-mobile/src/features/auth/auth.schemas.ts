import * as yup from "yup";

export const loginSchema = yup.object({
  username: yup.string().trim().required("Le nom d’utilisateur est requis."),
  password: yup.string().required("Le mot de passe est requis."),
  email: yup.string().defined(),
});

export const signupSchema = loginSchema.shape({
  email: yup.string().trim().email("L’adresse e-mail est invalide.").defined(),
});
