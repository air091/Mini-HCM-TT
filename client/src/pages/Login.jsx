import { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { getDashboardPath } from "../lib/auth";

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

  if (loading) return <div>Loading...</div>;
  if (user) return <Navigate to={getDashboardPath(user.role)} replace />;

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="border px-3 py-5 w-full max-w-[420px]">
        <header>
          <h1 className="text-[20px]">Login your account</h1>
        </header>

        <form onSubmit={handleOnSubmit} className="">
          {error && (
            <p className="py-1 px-2 border border-red-500 bg-red-100 mt-2 text-[14px]">
              {error}
            </p>
          )}
          <label className="mt-2">
            <span>Email</span>
            <input
              type="email"
              name="email"
              placeholder="Ex. johndoe@email.com"
              value={loginCredentials.email}
              onChange={handleOnChange}
              required
              className="block border px-2 py-1 w-full"
            />
          </label>

          <label className="mt-2">
            <span>Password</span>

            <div className="relative border">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                value={loginCredentials.password}
                onChange={handleOnChange}
                required
                className="block px-2 py-1 w-full"
              />

              <div
                className="absolute right-0 top-0 h-full flex items-center px-2 cursor-pointer"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <Eye size={18} /> : <EyeClosed size={18} />}
              </div>
            </div>
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="cursor-pointer block border px-4 mt-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Logging in..." : "Login"}
          </button>

          <p className="mt-3 text-[14px]">
            No account yet?{" "}
            <Link to="/register" className="underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
