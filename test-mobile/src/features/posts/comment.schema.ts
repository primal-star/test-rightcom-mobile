import * as yup from "yup";

export const commentSchema = yup.object({
  text: yup.string()
    .trim()
    .required("Le commentaire est requis.")
    .max(500, "Le commentaire ne peut pas dépasser 500 caractères."),
});
