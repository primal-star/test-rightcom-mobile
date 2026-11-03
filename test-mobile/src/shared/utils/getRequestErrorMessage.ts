import { UserFacingError } from "./UserFacingError";

const messages: Record<number, string> = {
  1: "Un problème est survenu. Veuillez réessayer dans quelques instants.",
  100: "La connexion est indisponible. Vérifiez votre connexion et réessayez.",
  101: "Ce contenu n’est plus disponible ou cette action n’est pas autorisée.",
  119: "Vous n’avez pas l’autorisation d’effectuer cette action.",
  124: "Cette action prend plus de temps que prévu. Vérifiez si elle a abouti avant de réessayer.",
  125: "L’adresse e-mail n’est pas valide.",
  142: "Certaines informations ne sont pas valides. Vérifiez votre saisie.",
  202: "Ce nom d’utilisateur est déjà utilisé.",
  203: "Cette adresse e-mail est déjà utilisée.",
  206: "Connectez-vous pour effectuer cette action.",
  209: "Votre session a expiré. Veuillez vous reconnecter.",
};

export function getRequestErrorMessage(
  error: unknown,
  fallback = "Une erreur est survenue. Veuillez réessayer.",
) {
  if (
    typeof error === "object"
    && error !== null
    && "notificationHandled" in error
    && error.notificationHandled === true
  ) {
    return "";
  }

  if (error instanceof UserFacingError) {
    return error.message;
  }

  const code = typeof error === "object" && error !== null && "code" in error
    ? error.code
    : undefined;

  if (typeof code === "number" && messages[code]) {
    return messages[code];
  }

  const message = typeof error === "string"
    ? error
    : typeof error === "object" && error !== null && "message" in error
      ? error.message
      : undefined;

  if (typeof message !== "string" || !message.trim()) {
    return fallback;
  }

  if (/network request failed|failed to fetch|networkerror|unable to connect to the parse api|failed to connect|econnrefused|etimedout/i.test(message)) {
    return messages[100];
  }

  return fallback;
}
