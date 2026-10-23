import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ShoppingBag, Briefcase, ShieldAlert, ArrowRight } from "lucide-react";
import api from "../services/Axios";

const AuthPage = ({ type = "login" }) => {
  const navigate = useNavigate();

  const [roleMode, setRoleMode] = useState("buyer"); // "buyer" | "seller"
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    brandName: "",
    bio: "",
    website: "",
    businessNumber: ""
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
      let endpoint = "/auth/login";
      let payload = {
        email: formData.email,
        password: formData.password,
        targetRole: roleMode
      };

      if (type === "register") {
        if (roleMode === "seller") {
          endpoint = "/auth/register-brand";
          payload = { ...formData };
        } else {
          endpoint = "/auth/register";
          payload = {
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName
          };
        }
      }

      const response = await api.post(endpoint, payload);

      const user = response.data?.user;
      const userRole = user?.role || (roleMode === "seller" ? "seller" : "user");

      if (response.data?.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userRole", userRole);
      }

      if (userRole === "admin" || userRole === "super_admin") {
        navigate("/admin");
      } else if (userRole === "seller") {
        navigate("/seller");
      } else {
        navigate("/");
      }
      window.location.reload();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Authentication failed. Please verify your details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-dominant flex items-center justify-center px-4 py-16 antialiased">
      <div className="absolute inset-0 bg-secondary/3 pointer-events-none" />

      <div className="relative w-full max-w-lg">
        <div className="bg-dominant border border-secondary/15 rounded-3xl shadow-2xl p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-black text-secondary tracking-tight">
              {type === "login" ? "Welcome Back" : "Join the Marketplace"}
            </h1>
            <p className="text-sm text-secondary/60 mt-1">
              {type === "login"
                ? "Select your account type to sign in"
                : "Choose whether you are shopping or selling"}
            </p>
          </div>

          {/* Account Role Selector Tabs */}
          <div className="flex rounded-2xl bg-secondary/5 p-1 mb-6 border border-secondary/10">
            <button
              type="button"
              onClick={() => { setRoleMode("buyer"); setError(""); }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                roleMode === "buyer"
                  ? "bg-secondary text-dominant shadow-sm"
                  : "text-secondary/60 hover:text-secondary"
              }`}
            >
              <ShoppingBag size={15} />
              {type === "login" ? "Buyer Login" : "Buyer Registration"}
            </button>
            <button
              type="button"
              onClick={() => { setRoleMode("seller"); setError(""); }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                roleMode === "seller"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-secondary/60 hover:text-secondary"
              }`}
            >
              <Briefcase size={15} />
              {type === "login" ? "Brand Seller Login" : "Brand Registration"}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Seller-Specific Brand Fields */}
            {type === "register" && roleMode === "seller" && (
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">
                  Brand Business Information
                </span>
                <div>
                  <label className="block text-xs font-semibold text-secondary/80 mb-1">
                    Brand / Label Name *
                  </label>
                  <input
                    type="text"
                    name="brandName"
                    value={formData.brandName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Atelier Milano"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/20 bg-dominant text-secondary text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-secondary/80 mb-1">
                      Official Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://brand.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/20 bg-dominant text-secondary text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary/80 mb-1">
                      Business Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/20 bg-dominant text-secondary text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary/80 mb-1">
                    Brand Bio & Aesthetics
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Brief description of your apparel and collections..."
                    className="w-full px-3.5 py-2 rounded-xl border border-secondary/20 bg-dominant text-secondary text-xs focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Name Fields for Registration */}
            {type === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-secondary/80 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/20 bg-dominant text-secondary text-xs focus:outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary/80 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/20 bg-dominant text-secondary text-xs focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>
            )}

            {/* Email & Password */}
            <div>
              <label className="block text-xs font-semibold text-secondary/80 mb-1">
                {roleMode === "seller" ? "Brand Login Email *" : "Email Address *"}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder={roleMode === "seller" ? "brand@company.com" : "you@email.com"}
                className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/20 bg-dominant text-secondary text-xs focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary/80 mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/20 bg-dominant text-secondary text-xs focus:outline-none focus:border-secondary"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-2 shadow-lg ${
                roleMode === "seller"
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                  : "bg-secondary hover:bg-secondary/90 text-dominant shadow-secondary/10"
              }`}
            >
              {isLoading && <Loader2 className="animate-spin" size={15} />}
              <span>
                {isLoading
                  ? "Processing..."
                  : type === "login"
                  ? roleMode === "seller" ? "Sign In to Brand Portal" : "Sign In to Shopping"
                  : roleMode === "seller" ? "Register Brand & Launch Store" : "Create Buyer Account"}
              </span>
            </button>
          </form>

          {/* Bottom Switcher */}
          <div className="mt-6 text-center text-xs text-secondary/60">
            {type === "login" ? (
              <p>
                Don't have an account?{" "}
                <Link to="/register" className="font-bold text-secondary hover:underline">
                  Create one
                </Link>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <Link to="/login" className="font-bold text-secondary hover:underline">
                  Sign In
                </Link>
              </p>
            )}
          </div>

          {/* Super Admin Gateway Link */}
          <div className="mt-6 pt-4 border-t border-secondary/10 text-center">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-secondary/40 hover:text-indigo-600 transition-colors"
            >
              <ShieldAlert size={13} /> Super Administrator Portal Gateway <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthPage;
