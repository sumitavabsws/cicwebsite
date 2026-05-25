import { createContext, useContext, useEffect, useState } from "react";
import {
  apiRequest,
  clearStoredAdminSession,
  readStoredAdminSession,
  writeStoredAdminSession,
} from "../lib/api";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(readStoredAdminSession);
  const [loading, setLoading] = useState(Boolean(readStoredAdminSession()));

  useEffect(() => {
    const storedSession = readStoredAdminSession();

    if (!storedSession?.token) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function validateSession() {
      try {
        const response = await apiRequest("/auth/me", {
          token: storedSession.token,
        });

        if (!isMounted) {
          return;
        }

        const nextSession = {
          username: response.username,
          token: storedSession.token,
        };

        setSession(nextSession);
        writeStoredAdminSession(nextSession);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        clearStoredAdminSession();
        setSession(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    validateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (username, password) => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        username: username.trim(),
        password,
      },
    });

    const nextSession = {
      username: response.username,
      token: response.token,
    };

    setSession(nextSession);
    writeStoredAdminSession(nextSession);

    return {
      success: true,
    };
  };

  const logout = () => {
    clearStoredAdminSession();
    setSession(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser: session,
        isAuthenticated: Boolean(session?.token),
        loading,
        login,
        logout,
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
