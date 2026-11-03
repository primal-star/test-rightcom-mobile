import { createContext } from "react";
import type { Parse } from "@/shared/lib/parse";

export type SessionContextValue = {
  user: Parse.User | null;
  isSigningOut: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
  withSession: <T>(request: () => Promise<T>) => Promise<T>;
};

export const SessionContext = createContext<SessionContextValue | undefined>(undefined);
