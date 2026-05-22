import { createContext, useState, useEffect, useContext } from "react";
import api from "../lib/api";
import axios from "axios";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  let refreshPromise = null;

  const setAuthHeader = (token) => {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  };

  // =========================
  // PROFILE
  // =========================
  const fetchProfile = async (token) => {
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
  };

  // =========================
  // REGISTER
  // =========================
  const register = async (payload) => {
    try {
      setError(null);
      const response = await api.post("/api/auth/register", payload);
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
        email,
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
  const refreshToken = async () => {
    if (!refreshPromise) {
      refreshPromise = api
        .post("/api/auth/refresh")
        .then(async (response) => {
          const newToken = response.data.accessToken;

          setAccessToken(newToken);
          setAuthHeader(newToken);

          await fetchProfile(newToken);

          return newToken;
        })
        .catch((err) => {
          logout();
          setError("Session expired. Please login again.");
          return null;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    return refreshPromise;
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = async () => {
    try {
      setUser(null);
      setAccessToken(null);
      setError(null);

      await api.post("/api/auth/logout");
    } catch (err) {
      // even if logout fails, clear local state
      setUser(null);
      setAccessToken(null);
    }
  };

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
      } catch (err) {
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

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
  }, []);

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
