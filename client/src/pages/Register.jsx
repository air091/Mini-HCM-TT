import { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { getDashboardPath } from "../lib/auth";
import LoadingScreen from "../components/LoadingScreen";

export default function Register() {
  const { register, error, user, loading } = useAuth();
  const navigate = useNavigate();

  const [registerCredentials, setRegisterCredentials] = useState({
    name: "",
    email: "",
    timeZone: "Asia/Manila",
    role: "employee",
    schedule: {
      start: "",
      end: "",
    },
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleOnChange = (event) => {
    const { name, value } = event.target;

    setRegisterCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleScheduleChange = (field, value) => {
    setRegisterCredentials((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [field]: value,
      },
    }));
  };

  const handleOnSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (registerCredentials.password !== registerCredentials.confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    try {
      setSubmitting(true);
      const response = await register(registerCredentials);
      navigate(getDashboardPath(response.user.role), { replace: true });
    } catch {
      // AuthContext owns the visible error message.
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={getDashboardPath(user.role)} replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-[540px] border bg-white px-5 py-6">
        <header className="mb-4">
          <p className="text-sm font-semibold text-slate-500">Mini HCM</p>
          <h1 className="text-xl font-semibold">Register your account</h1>
        </header>

        <form onSubmit={handleOnSubmit} className="space-y-3">
          {(error || formError) && (
            <p className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError || error}
            </p>
          )}

          <label className="block">
            <span className="text-sm font-medium">Name</span>
            <input
              type="text"
              name="name"
              value={registerCredentials.name}
              onChange={handleOnChange}
              autoComplete="off"
              required
              className="mt-1 block w-full border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              name="email"
              value={registerCredentials.email}
              onChange={handleOnChange}
              autoComplete="off"
              required
              className="mt-1 block w-full border px-3 py-2 text-sm"
            />
          </label>

          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Timezone</span>
            <select
              name="timeZone"
              value={registerCredentials.timeZone}
              onChange={handleOnChange}
              className="border px-3 py-2 text-sm"
            >
              <option value="Asia/Manila">Asia/Manila</option>
            </select>
          </label>

          <div>
            <span className="block text-sm font-medium">Schedule</span>

            <div className="mt-1 flex gap-2">
              <div className="w-full">
                <span className="block text-xs text-slate-500">Start</span>
                <input
                  type="time"
                  value={registerCredentials.schedule.start}
                  onChange={(e) =>
                    handleScheduleChange("start", e.target.value)
                  }
                  required
                  className="block w-full border px-3 py-2 text-sm"
                />
              </div>

              <div className="w-full">
                <span className="block text-xs text-slate-500">End</span>
                <input
                  type="time"
                  value={registerCredentials.schedule.end}
                  onChange={(e) => handleScheduleChange("end", e.target.value)}
                  required
                  className="w-full border px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium">Password</span>

            <div className="relative mt-1 border">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={registerCredentials.password}
                onChange={handleOnChange}
                required
                className="block w-full px-3 py-2 pr-10 text-sm"
              />

              <button
                type="button"
                className="absolute right-0 top-0 flex h-full cursor-pointer items-center px-3"
                onClick={() => setShowPassword((p) => !p)}
              >
                {showPassword ? <Eye size={18} /> : <EyeClosed size={18} />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Confirm password</span>

            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={registerCredentials.confirmPassword}
              onChange={handleOnChange}
              required
              className="mt-1 block w-full border px-3 py-2 text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="block w-full cursor-pointer bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Register"}
          </button>

          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-medium underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
