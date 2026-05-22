import { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { getDashboardPath } from "../lib/auth";
import LoadingScreen from "../components/LoadingScreen";

export default function Login() {
  const { login, error, user, loading } = useAuth();
  const [loginCredentials, setLoginCredentials] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleOnChange = (event) => {
    const { name, value } = event.target;
    setLoginCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleOnSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      const response = await login(
        loginCredentials.email,
        loginCredentials.password,
      );

      const fallbackPath = getDashboardPath(response.user.role);
      navigate(location.state?.from?.pathname || fallbackPath, {
        replace: true,
      });
    } catch {
      // AuthContext owns the visible error message.
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={getDashboardPath(user.role)} replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-105 border bg-white px-5 py-6">
        <header className="mb-4">
          <p className="text-sm font-semibold text-slate-500">Mini HCM</p>
          <h1 className="text-xl font-semibold">Login your account</h1>
        </header>

        <form onSubmit={handleOnSubmit} className="space-y-3">
          {error && (
            <p className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              name="email"
              placeholder="Ex. johndoe@email.com"
              value={loginCredentials.email}
              onChange={handleOnChange}
              required
              className="mt-1 block w-full border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Password</span>

            <div className="relative mt-1 border">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                value={loginCredentials.password}
                onChange={handleOnChange}
                required
                className="block w-full px-3 py-2 pr-10 text-sm"
              />

              <button
                type="button"
                className="absolute right-0 top-0 flex h-full cursor-pointer items-center px-3"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <Eye size={18} /> : <EyeClosed size={18} />}
              </button>
            </div>
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="block w-full cursor-pointer bg-primary px-4 py-2 text-sm font-medium text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Logging in..." : "Login"}
          </button>

          <p className="text-sm text-slate-600">
            No account yet?{" "}
            <Link to="/register" className="font-medium underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
