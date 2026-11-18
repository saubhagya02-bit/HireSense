import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, AlertCircle } from "lucide-react";
import { authAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

function getErrorMessage(err: any): string {
  if (!err.response) return "Cannot reach the server. Check that the backend is running.";
  const detail = err.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (err.response.status === 422) return "Please enter a valid email and password.";
  return "Login failed. Please try again.";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await authAPI.login(form);
      setAuth(data.user, data.access_token);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err: any) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-volt rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-ink-950" strokeWidth={2.5} />
            </div>
            <span className="font-display font-800 text-2xl">HireSense</span>
          </div>
          <h1 className="font-display text-3xl font-700 mb-2">Welcome back</h1>
          <p className="text-slate-400 text-sm">Sign in to continue your practice</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-body">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update({ email: e.target.value })}
                  className="w-full bg-ink-700 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:border-volt/40 transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-slate-400 font-body">Password</label>
                <Link to="/forgot-password" className="text-xs text-volt hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update({ password: e.target.value })}
                  className="w-full bg-ink-700 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:border-volt/40 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-4">
          No account?{" "}
          <Link to="/register" className="text-volt hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}