import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { authAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({
    email: "",
    full_name: "",
    password: "",
    target_role: "",
    experience_years: 0,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await authAPI.register(form);
      setAuth(data.user, data.access_token);

      toast.success("Account created!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-slate-900" strokeWidth={2.5} />
            </div>

            <span className="text-2xl font-bold">HireSense</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">Start Preparing</h1>

          <p className="text-slate-500">Create your account — it's free</p>
        </div>

        {/* Register Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Full Name
              </label>

              <input
                type="text"
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 text-sm placeholder:text-slate-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
                placeholder="Your Name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Email
              </label>

              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 text-sm placeholder:text-slate-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
                placeholder="you@gmail.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Password
              </label>

              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 text-sm placeholder:text-slate-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
                placeholder="Minimum 8 characters"
                required
              />
            </div>

            {/* Target Role */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Target Role
              </label>

              <input
                type="text"
                value={form.target_role}
                onChange={(e) =>
                  setForm({ ...form, target_role: e.target.value })
                }
                className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 text-sm placeholder:text-slate-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
                placeholder="e.g. Software Engineer"
              />
            </div>

            {/* Experience */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Years of Experience
              </label>

              <input
                type="number"
                min={0}
                max={50}
                value={form.experience_years}
                onChange={(e) =>
                  setForm({
                    ...form,
                    experience_years: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 text-slate-900 font-semibold py-3 rounded-xl hover:bg-yellow-300 transition disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-yellow-400 hover:text-yellow-300 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
