import * as yup from "yup";

export const postSchema = yup.object({
  title: yup.string()
    .trim()
    .required("Le titre est requis.")
    .min(3, "Le titre doit contenir au moins 3 caractères.")
    .max(120, "Le titre ne peut pas dépasser 120 caractères."),
  body: yup.string()
    .trim()
    .required("Le contenu est requis.")
    .max(5000, "Le contenu ne peut pas dépasser 5 000 caractères."),
});
