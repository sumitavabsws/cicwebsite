/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  apiRequest,
  clearStoredAdminSession,
  readStoredAdminSession,
  writeStoredAdminSession,
} from "../lib/api";

const AdminAuthContext = createContext(null);

const SESSION_CHECK_INTERVAL_MS = 60 * 1000;
const SESSION_ACTIVITY_DEBOUNCE_MS = 30 * 1000;
const SESSION_WARNING_SECONDS = 5 * 60;

function consumeSessionIdFromUrl() {
  if (typeof window === "undefined") {
    return null;
  }

  const url = new URL(window.location.href);
  const sessionId = url.searchParams.get("sid");

  if (!sessionId) {
    return null;
  }

  url.searchParams.delete("sid");
  window.history.replaceState({}, "", url.toString());
  return sessionId;
}

export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionWarning, setSessionWarning] = useState(null);
  const sessionRef = useRef(null);
  const lastActivityAtRef = useRef(0);

  const clearSession = useCallback(() => {
    clearStoredAdminSession();
    sessionRef.current = null;
    setSession(null);
    setSessionWarning(null);
  }, []);

  const validateSession = useCallback(
    async (sessionId, { renew = false } = {}) => {
      try {
        const response = await apiRequest(`/auth/me?renew=${renew ? "1" : "0"}`, {
          token: sessionId,
        });

        const nextSession = {
          token: sessionId,
          username: response.username,
          employeeCode: response.employee_code,
          expiresAt: response.expires_at,
          secondsRemaining: response.seconds_remaining,
          sso: response.sso,
        };

        sessionRef.current = nextSession;
        setSession(nextSession);
        writeStoredAdminSession(nextSession);

        if (
          Number.isFinite(response.seconds_remaining) &&
          response.seconds_remaining <= SESSION_WARNING_SECONDS
        ) {
          setSessionWarning(response.seconds_remaining);
        } else {
          setSessionWarning(null);
        }

        return nextSession;
      } catch (error) {
        clearSession();
        throw error;
      }
    },
    [clearSession],
  );

  useEffect(() => {
    const urlSessionId = consumeSessionIdFromUrl();
    const storedSession = readStoredAdminSession();
    const sessionId = urlSessionId ?? storedSession?.token;

    if (!sessionId) {
      setLoading(false);
      return;
    }

    const validationTimer = window.setTimeout(() => {
      validateSession(sessionId, { renew: Boolean(urlSessionId) })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 0);

    return () => {
      window.clearTimeout(validationTimer);
    };
  }, [validateSession]);

  useEffect(() => {
    if (!session?.token) {
      return undefined;
    }

    const checkTimer = window.setInterval(() => {
      validateSession(session.token, { renew: false }).catch(() => {});
    }, SESSION_CHECK_INTERVAL_MS);

    function handleActivity() {
      const now = Date.now();

      if (now - lastActivityAtRef.current < SESSION_ACTIVITY_DEBOUNCE_MS) {
        return;
      }

      lastActivityAtRef.current = now;
      validateSession(session.token, { renew: true }).catch(() => {});
    }

    ["click", "keydown", "mousemove", "scroll", "touchstart"].forEach((eventName) => {
      document.addEventListener(eventName, handleActivity, { passive: true });
    });

    return () => {
      window.clearInterval(checkTimer);
      ["click", "keydown", "mousemove", "scroll", "touchstart"].forEach((eventName) => {
        document.removeEventListener(eventName, handleActivity);
      });
    };
  }, [session?.token, validateSession]);

  const login = async ({ username, password }) => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        username,
        password,
      },
    });

    const nextSession = {
      token: response.token,
      username: response.username,
      employeeCode: response.employee_code,
      expiresAt: response.expires_at,
      secondsRemaining: response.seconds_remaining,
      sso: response.sso,
    };

    sessionRef.current = nextSession;
    setSession(nextSession);
    setSessionWarning(null);
    writeStoredAdminSession(nextSession);
    return nextSession;
  };

  const logout = async () => {
    const currentToken = sessionRef.current?.token;

    if (currentToken) {
      try {
        await apiRequest("/auth/logout", {
          method: "POST",
          token: currentToken,
        });
      } catch (error) {
        console.error("Unable to invalidate Ananta session.", error);
      }
    }

    clearSession();
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser: session,
        isAuthenticated: Boolean(session?.token),
        loading,
        login,
        logout,
        sessionWarning,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider.");
  }

  return context;
}
