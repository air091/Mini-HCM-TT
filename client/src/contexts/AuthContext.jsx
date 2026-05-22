import { useState, useEffect, useRef, useCallback } from "react";
import api from "../lib/api";
import axios from "axios";
import { AuthContext } from "./authContextValue";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshPromiseRef = useRef(null);

  const setAuthHeader = (token) => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      return;
    }

    delete api.defaults.headers.common.Authorization;
  };

  // =========================
  // PROFILE
  // =========================
  const fetchProfile = useCallback(async (token) => {
    try {
      const response = await api.get("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(response.data.user);
      setError(null);

      return response.data.user;
    } catch (err) {
      setError("Failed to fetch user profile");
      throw err;
    }
  }, []);

  // =========================
  // REGISTER
  // =========================
  const register = async (payload) => {
    try {
      setError(null);
      const registrationPayload = { ...payload };
      delete registrationPayload.confirmPassword;
      const response = await api.post("/api/auth/register", registrationPayload);
      const token = response.data.accessToken;
      setAccessToken(token);
      setAuthHeader(token);

      const profile = await fetchProfile(token);

      setUser(profile);

      return { user: profile };
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Registration failed");
      } else {
        setError("Registration failed");
      }
      throw err;
    }
  };

  // =========================
  // LOGIN
  // =========================
  const login = async (email, password) => {
    try {
      setError(null);

      const response = await api.post("/api/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const token = response.data.accessToken;

      setAccessToken(token);
      setAuthHeader(token);

      const profile = await fetchProfile(token);

      setUser(profile);

      return { user: profile };
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Login failed");
      }
      throw err;
    }
  };

  // =========================
  // REFRESH TOKEN
  // =========================
  const logout = useCallback(async () => {
    const token = api.defaults.headers.common.Authorization;

    setUser(null);
    setAccessToken(null);
    setError(null);
    setAuthHeader(null);

    try {
      await api.post("/api/auth/logout", null, {
        headers: token ? { Authorization: token } : undefined,
      });
    } catch {
      // Local auth state is already cleared.
    }
  }, []);

  const refreshToken = useCallback(async () => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = api
        .post("/api/auth/refresh")
        .then(async (response) => {
          const newToken = response.data.accessToken;

          setAccessToken(newToken);
          setAuthHeader(newToken);

          await fetchProfile(newToken);

          return newToken;
        })
        .catch(() => {
          logout();
          setError("Session expired. Please login again.");
          return null;
        })
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }

    return refreshPromiseRef.current;
  }, [fetchProfile, logout]);

  // =========================
  // INIT AUTH
  // =========================
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await api.post("/api/auth/refresh");

        const newToken = response.data.accessToken;

        setAccessToken(newToken);
        setAuthHeader(newToken);

        await fetchProfile(newToken);

        setError(null);
      } catch {
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [fetchProfile]);

  // =========================
  // AXIOS INTERCEPTOR
  // =========================
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (res) => res,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const newToken = await refreshToken();

          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }

        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [refreshToken]);

  // =========================
  // CONTEXT VALUE
  // =========================
  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        error,
        login,
        register,
        logout,
        api,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
