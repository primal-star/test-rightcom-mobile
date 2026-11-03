import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Parse } from "@/shared/lib/parse";
import { RequestState, Screen } from "@/shared/components";
import { SessionContext } from "./contexts/SessionContext";
import { getRequestErrorMessage } from "@/shared/utils/getRequestErrorMessage";
import { usePathname } from "expo-router";
import { useToast } from "@/shared/hooks/useToast";
import { isPublicPage } from "./utils/isPublicPage";

function errorMessage(error: unknown) {
  return getRequestErrorMessage(error, "Une erreur de session est survenue.");
}

export function SessionProvider(props: PropsWithChildren) {
  const [user, setUser] = useState<Parse.User | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const signOutPromise = useRef<Promise<void> | null>(null);
  const pathname = usePathname();
  const currentPath = useRef(pathname);
  const showToast = useToast();
  const expiration = useRef<{
    token: string;
    promise: Promise<boolean>;
  } | null>(null);

  useEffect(() => {
    currentPath.current = pathname;
  }, [pathname]);

  const refreshSession = useCallback(async () => {
    const currentUser = await Parse.User.currentAsync();

    setUser(currentUser);
    setError(null);
  }, []);

  const restoreSession = useCallback(async () => {
    setIsRestoring(true);
    setRestoreError(null);

    try {
      await refreshSession();
    } catch (cause) {
      setRestoreError(errorMessage(cause));
    } finally {
      setIsRestoring(false);
    }
  }, [refreshSession]);

  useEffect(() => {
    let active = true;

    Parse.User.currentAsync()
      .then((currentUser) => {
        if (active) {
          setUser(currentUser);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setRestoreError(errorMessage(cause));
        }
      })
      .finally(() => {
        if (active) {
          setIsRestoring(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const signOut = useCallback(() => {
    if (signOutPromise.current) {
      return signOutPromise.current;
    }

    setIsSigningOut(true);
    setError(null);

    const pending = (async () => {
      try {
        await Parse.User.logOut();
      } catch (cause) {
        // The SDK clears its local user before trying to revoke the remote session.
        setError(errorMessage(cause));
      } finally {
        try {
          setUser(await Parse.User.currentAsync());
        } catch (cause) {
          setRestoreError(errorMessage(cause));
        } finally {
          setIsSigningOut(false);
          signOutPromise.current = null;
        }
      }
    })();

    signOutPromise.current = pending;

    return pending;
  }, []);

  const expireSession = useCallback((token: string) => {
    if (expiration.current?.token === token) {
      return expiration.current.promise;
    }

    const publicPage = isPublicPage(currentPath.current);

    const promise = (async () => {
      await signOut();

      if (publicPage) {
        setError(null);
        showToast("Votre session a expiré. Vous avez été déconnecté");

        return true;
      }

      setError("Votre session a expiré. Veuillez vous reconnecter.");

      return false;
    })();

    expiration.current = {
      token,
      promise,
    };

    return promise;
  }, [showToast, signOut]);

  const withSession = useCallback(async <T,>(request: () => Promise<T>): Promise<T> => {
    const currentUser = await Parse.User.currentAsync();
    const sessionToken = currentUser?.getSessionToken();

    try {
      return await request();
    } catch (cause) {
      if (cause instanceof Parse.Error && cause.code === Parse.Error.INVALID_SESSION_TOKEN) {
        const latestUser = await Parse.User.currentAsync();

        // Ignore an old request if another user has since signed in.
        if (sessionToken && (
          latestUser?.getSessionToken() === sessionToken
          || expiration.current?.token === sessionToken
        )) {
          const notified = await expireSession(sessionToken);

          if (notified) {
            Object.assign(cause, {
              notificationHandled: true,
            });
          }
        }
      }

      throw cause;
    }
  }, [expireSession]);

  if (isRestoring || restoreError) {
    return (
      <Screen>
        <RequestState
          status={isRestoring ? "loading" : "error"}
          message={isRestoring ? "Restauration de la session…" : restoreError ?? undefined}
          onRetry={() => void restoreSession()}
        />
      </Screen>
    );
  }

  return (
    <SessionContext.Provider
      value={{
        user,
        isSigningOut,
        error,
        refreshSession,
        signOut,
        withSession,
      }}
    >
      {props.children}
    </SessionContext.Provider>
  );
}

