import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Lock, Key, Eye, EyeOff } from "lucide-react";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    token: "",
    new_password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.new_password !== form.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.new_password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(form.token.trim(), form.new_password);
      toast.success("Password reset successfully!");
      navigate("/login");
    } catch (err: any) {
      toast.error(
        err.response?.data?.detail || "Reset failed. Token may be expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-slate-900" />
            </div>
            <span className="text-2xl font-bold">HireSense</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">Reset password</h1>
          <p className="text-slate-500 text-sm">
            Enter your reset token and new password
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* TOKEN */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Reset Token
              </label>

              <div className="relative">
                <Key
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={form.token}
                  onChange={(e) =>
                    setForm({ ...form, token: e.target.value })
                  }
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm font-mono placeholder:text-slate-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
                  placeholder="Paste your reset token"
                  required
                />
              </div>
            </div>

            {/* NEW PASSWORD */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                New Password
              </label>

              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={form.new_password}
                  onChange={(e) =>
                    setForm({ ...form, new_password: e.target.value })
                  }
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl pl-9 pr-10 py-3 text-sm placeholder:text-slate-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
                  placeholder="Min. 8 characters"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff size={14} />
                  ) : (
                    <Eye size={14} />
                  )}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Confirm New Password
              </label>

              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={form.confirm_password}
                  onChange={(e) =>
                    setForm({ ...form, confirm_password: e.target.value })
                  }
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm placeholder:text-slate-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
                  placeholder="Repeat new password"
                  required
                />
              </div>

              {form.confirm_password && (
                <p
                  className={`text-xs mt-1 ${
                    form.new_password === form.confirm_password
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {form.new_password === form.confirm_password
                    ? "✓ Passwords match"
                    : "✗ Passwords do not match"}
                </p>
              )}
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 text-slate-900 font-semibold py-3 rounded-xl hover:bg-yellow-300 transition"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-4">
          <Link to="/login" className="text-yellow-400 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}