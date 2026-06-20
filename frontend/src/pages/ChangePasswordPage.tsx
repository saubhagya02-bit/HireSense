import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.new_password !== form.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    if (form.new_password.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (form.current_password === form.new_password) {
      toast.error("New password must be different from current password");
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword(form.current_password, form.new_password);
      toast.success("Password changed successfully!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to change password");
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

          <h1 className="text-3xl font-bold mb-2">Change Password</h1>
          <p className="text-slate-500 text-sm">
            Update your account password
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* CURRENT PASSWORD */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Current Password
              </label>

              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type={showCurrent ? "text" : "password"}
                  value={form.current_password}
                  onChange={(e) =>
                    setForm({ ...form, current_password: e.target.value })
                  }
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl pl-9 pr-10 py-3 text-sm placeholder:text-slate-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
                  placeholder="Enter current password"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
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
                  type={showNew ? "text" : "password"}
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
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
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
                  type={showNew ? "text" : "password"}
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
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* FOOTER */}
        <p className="text-center text-sm text-slate-500 mt-4">
          <Link to="/" className="text-yellow-400 hover:underline">
            Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}