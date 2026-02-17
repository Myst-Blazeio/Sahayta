import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: string | null;
  loading: boolean;
  login: (userData: User, authToken: string, userRole: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = sessionStorage.getItem("token");
      const storedRole = sessionStorage.getItem("role");

      if (storedToken) {
        setToken(storedToken);
        setRole(storedRole);
        try {
          // Fetch fresh user data
          const response = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (response.ok) {
            const userData: User = await response.json();
            setUser(userData);
            // Update session storage with fresh data
            sessionStorage.setItem("user", JSON.stringify(userData));
          } else {
            // Token invalid or expired — fall back to stored user
            const storedUser = sessionStorage.getItem("user");
            if (storedUser) {
              setUser(JSON.parse(storedUser));
            } else {
              logout();
            }
          }
        } catch (error) {
          console.error("Auth init failed (backend unavailable)", error);
          // Fallback to stored user if fetch fails (e.g. no backend)
          const storedUser = sessionStorage.getItem("user");
          if (storedUser) setUser(JSON.parse(storedUser));
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = (userData: User, authToken: string, userRole: string) => {
    // Save to sessionStorage (clears on tab close)
    sessionStorage.setItem("token", authToken);
    sessionStorage.setItem("user", JSON.stringify(userData));
    sessionStorage.setItem("role", userRole);

    setToken(authToken);
    setUser(userData);
    setRole(userRole);
  };

  const logout = () => {
    // const currentRole = role || sessionStorage.getItem("role"); 
    sessionStorage.clear();
    setToken(null);
    setUser(null);
    setRole(null);

    // Redirect to Flask backend for police logout or stays here for citizen?
    // Actually, police logout is now handled by backend routes, but if we are here, we might need to redirect.
    // For now, simple client side clear is fine.

    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
