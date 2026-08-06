import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "../services/Axios";

const AuthPage = ({ type = "login" }) => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setError("");

    try {
      const endpoint =
        type === "login" ? "/auth/login" : "/auth/register";

      const response = await api.post(endpoint, formData);

      if (response.data?.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userRole", response.data?.user?.role || "user");
      }

      const userRole = response.data?.user?.role || "user";
      navigate(userRole === "admin" ? "/admin" : "/");
      window.location.reload();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-dominant flex items-center justify-center px-6 py-16">

      <div className="absolute inset-0 bg-secondary/3" />

      <div className="relative w-full max-w-md">


        <div className="bg-dominant border border-secondary/10 rounded-3xl shadow-xl p-8">

          <div className="mb-8 text-center">

            <h1 className="text-3xl font-black text-secondary">
              {type === "login"
                ? "Welcome Back"
                : "Create Account"}
            </h1>

            <p className="text-secondary/60 mt-2">
              {type === "login"
                ? "Sign in to continue shopping."
                : "Join us and start shopping."}
            </p>

          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {type === "register" && (
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="firstName"
                  placeholder="First Name"
                  required
                  onChange={handleChange}
                  className="w-full rounded-xl border border-secondary/15 bg-secondary/5 px-4 py-3 outline-none focus:border-accent"
                />

                <input
                  name="lastName"
                  placeholder="Last Name"
                  required
                  onChange={handleChange}
                  className="w-full rounded-xl border border-secondary/15 bg-secondary/5 px-4 py-3 outline-none focus:border-accent"
                />
              </div>
            )}

            <input
              name="email"
              type="email"
              placeholder="Email Address"
              required
              onChange={handleChange}
              className="w-full rounded-xl border border-secondary/15 bg-secondary/5 px-4 py-3 outline-none focus:border-accent"
            />

            <input
              name="password"
              type="password"
              placeholder="Password"
              required
              onChange={handleChange}
              className="w-full rounded-xl border border-secondary/15 bg-secondary/5 px-4 py-3 outline-none focus:border-accent"
            />

            {error && (
              <div className="rounded-lg bg-red-100 border border-red-200 text-red-600 text-sm px-4 py-3">
                {error}
              </div>
            )}

            <button
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-secondary text-dominant font-semibold hover:bg-accent transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Please wait...
                </>
              ) : type === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>

          </form>

          <div className="mt-8 text-center text-secondary/60">

            {type === "login"
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              onClick={() =>
                navigate(type === "login" ? "/register" : "/login")
              }
              className="ml-2 font-semibold text-accent hover:underline"
            >
              {type === "login" ? "Register" : "Login"}
            </button>

          </div>

        </div>

      </div>
    </section>
  );
};

export default AuthPage;