import { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const { register, error } = useAuth();
  const navigate = useNavigate();

  const [registerCredentials, setRegisterCredentials] = useState({
    name: "",
    email: "",
    timeZone: "asia/manila",
    role: "employee",
    schedule: {
      start: "",
      end: "",
    },
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);

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

    if (registerCredentials.password !== registerCredentials.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await register(registerCredentials);
      const role = response.user.role;

      if (role === "admin") navigate("/admin/dashboard");
      else navigate("/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="border px-3 py-5 w-full max-w-[520px]">
        <h1 className="text-[20px]">Register your account</h1>

        <form onSubmit={handleOnSubmit}>
          {error && (
            <p className="py-1 px-2 border border-red-500 bg-red-100 mt-2 text-[14px]">
              {error}
            </p>
          )}

          {/* NAME */}
          <label className="mt-2 block">
            <span>Name</span>
            <input
              type="text"
              name="name"
              value={registerCredentials.name}
              onChange={handleOnChange}
              autoComplete="off"
              className="block border px-2 py-1 w-full"
            />
          </label>

          {/* EMAIL */}
          <label className="mt-2 block">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={registerCredentials.email}
              onChange={handleOnChange}
              autoComplete="off"
              className="block border px-2 py-1 w-full"
            />
          </label>

          {/* TIMEZONE */}
          <label className="mt-2 flex justify-between">
            <span>Timezone</span>
            <select
              name="timezone"
              value={registerCredentials.timezone}
              onChange={handleOnChange}
              className="border px-2 py-1"
            >
              <option value="asia/manila">Asia/Manila</option>
            </select>
          </label>

          {/* SCHEDULE */}
          <div className="mt-2">
            <span className="block">Schedule</span>

            <div className="flex gap-2">
              <div className="w-full">
                <span className="block">Start</span>
                <input
                  type="datetime-local"
                  value={registerCredentials.schedule.start}
                  onChange={(e) =>
                    handleScheduleChange("start", e.target.value)
                  }
                  className="border block px-2 py-1 w-full"
                />
              </div>

              <div className="w-full">
                <span className="block">End</span>
                <input
                  type="datetime-local"
                  value={registerCredentials.schedule.end}
                  onChange={(e) => handleScheduleChange("end", e.target.value)}
                  className="border px-2 py-1 w-full"
                />
              </div>
            </div>
          </div>

          {/* PASSWORD */}
          <label className="mt-2 block">
            <span>Password</span>

            <div className="relative border">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={registerCredentials.password}
                onChange={handleOnChange}
                className="block px-2 py-1 w-full"
              />

              <div
                className="absolute right-0 top-0 h-full flex items-center px-2 cursor-pointer"
                onClick={() => setShowPassword((p) => !p)}
              >
                {showPassword ? <Eye size={18} /> : <EyeClosed size={18} />}
              </div>
            </div>
          </label>

          {/* CONFIRM PASSWORD */}
          <label className="mt-2 block">
            <span>Confirm password</span>

            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={registerCredentials.confirmPassword}
              onChange={handleOnChange}
              className="block border px-2 py-1 w-full"
            />
          </label>

          <button
            type="submit"
            className="cursor-pointer block border px-4 mt-2"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
