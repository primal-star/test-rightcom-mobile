import { useContext } from "react";
import { SessionContext } from "../contexts/SessionContext";

export function useSession() {
  const session = useContext(SessionContext);

  if (!session) {
    throw new Error("useSession doit être utilisé dans SessionProvider.");
  }

  return session;
}
