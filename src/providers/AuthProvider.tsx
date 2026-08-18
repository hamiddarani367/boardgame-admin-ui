"use client";

import { createContext, useState, useEffect, useCallback, useRef } from "react";

interface User {
  id: string;
  phone: string;
  name: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // جلوگیری از setState همزمان با setTimeout
    timeoutRef.current = setTimeout(() => {
      try {
        const token = localStorage.getItem("access_token");
        const storedUser = localStorage.getItem("user");
        if (token && storedUser) {
          setAccessToken(token);
          setRefreshToken(localStorage.getItem("refresh_token"));
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("خطا در خواندن اطلاعات کاربر از localStorage", error);
      } finally {
        setIsLoading(false);
      }
    }, 0);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const login = useCallback(
    (accessToken: string, refreshToken: string, user: User) => {
      if (!accessToken || !refreshToken || !user) {
        console.error("❌ login: توکن یا کاربر نامعتبر است");
        return;
      }

      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
      setCookie("auth_token", accessToken);
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setUser(user);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    deleteCookie("auth_token");
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user?.permissions) return false;
      return user.permissions.includes(permission);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{ user, accessToken, refreshToken, login, logout, isLoading, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
}