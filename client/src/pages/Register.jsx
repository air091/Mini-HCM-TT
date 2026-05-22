import { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const { register, error } = useAuth();
  const [registerCredentials, setRegisterCredentials] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleOnChange = (event) => {
    const { name, value } = event.target;
    setLoginCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleOnSubmit = async (event) => {
    event.preventDefault();
    const response = await login(
      loginCredentials.email,
      loginCredentials.password,
    );

    const role = response.user.role;
    if (role === "admin") navigate("/admin/dashboard");
    else navigate("/dashboard");
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="border px-3 py-5 w-full max-w-[420px]">
        <header>
          <h1 className="text-[20px]">Register your account</h1>
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
              value={registerCredentials.email}
              onChange={handleOnChange}
              autoComplete="off"
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
                value={registerCredentials.password}
                onChange={handleOnChange}
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
            className="cursor-pointer block border px-4 mt-2"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
