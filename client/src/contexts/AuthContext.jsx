import { createContext, useState, useEffect, useContext } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // prevents multiple refresh calls at the same time
  let refreshPromise = null;

  const setAuthHeader = (token) => {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  };

  const fetchProfile = async (token) => {
    const response = await api.get("/auth/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setUser(response.data.user);
  };

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });

    const token = response.data.accessToken;

    setAccessToken(token);
    setAuthHeader(token);

    await fetchProfile(token);
  };

  const refreshToken = async () => {
    if (!refreshPromise) {
      refreshPromise = api
        .post("/auth/refresh")
        .then(async (response) => {
          const newToken = response.data.accessToken;

          setAccessToken(newToken);
          setAuthHeader(newToken);

          await fetchProfile(newToken);

          return newToken;
        })
        .catch((error) => {
          logout();
          return null;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    return refreshPromise;
  };

  const logout = async () => {
    setUser(null);
    setAccessToken(null);

    try {
      await api.post("/auth/logout");
    } catch (err) {
      // ignore logout errors
    }
  };

  // auto login on refresh
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await api.post("/auth/refresh");

        const newToken = response.data.accessToken;

        setAccessToken(newToken);
        setAuthHeader(newToken);

        await fetchProfile(newToken);
      } catch (error) {
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // interceptor: auto refresh on 401
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

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        login,
        logout,
        loading,
        api,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
