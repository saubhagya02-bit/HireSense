import { useState } from "react";
import { Link } from "react-router-dom";
import { Zap, Mail, ArrowLeft, Copy, Check } from "lucide-react";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<"form" | "done">("form");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.forgotPassword(email);
      setResetToken(data.reset_token);
      setStep("done");
      toast.success("Reset token generated!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(resetToken);
    setCopied(true);
    toast.success("Token copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-volt rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold">HireSense</span>
          </div>

          <h1 className="text-3xl font-bold mb-2 text-white">Forgot password?</h1>

          <p className="text-slate-500 text-sm">
            {step === "form"
              ? "Enter your email to get a reset token"
              : "Here's your password reset token"}
          </p>
        </div>

        <div className="bg-ink-800 border border-white/10 rounded-2xl p-6 shadow-xl">
          {step === "form" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={14}
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-ink-700 text-white border 10 rounded-xl pl-9 pr-4 py-3 text-sm focus:border-volt focus:ring-1 focus:ring-volt outline-none"
                    placeholder="you@gmail.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-volt text-white font-semibold py-3 rounded-xl hover:bg-purple-500"
              >
                {loading ? "Generating token..." : "Get Reset Token"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-sm text-green-400">
                  Token generated! Valid for 30 minutes.
                </p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Your reset token
                </label>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-ink-700 border 10 rounded-xl px-4 py-3 font-mono text-xs text-volt break-all">
                    {resetToken}
                  </div>

                  <button
                    onClick={copyToken}
                    className="p-3 bg-ink-700 border 10 rounded-xl"
                  >
                    {copied ? (
                      <Check size={14} className="text-green-400" />
                    ) : (
                      <Copy size={14} className="text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-ink-700 rounded-xl space-y-1.5">
                <p className="text-xs font-bold text-white">Next steps:</p>
                <p className="text-xs text-slate-400">1. Copy token</p>
                <p className="text-xs text-slate-400">2. Go to reset page</p>
                <p className="text-xs text-slate-400">3. Set new password</p>
              </div>

              <Link
                to="/reset-password"
                className="block text-center w-full bg-volt text-white font-semibold py-3 rounded-xl hover:bg-purple-500"
              >
                Go to Reset Password →
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          <Link
            to="/login"
            className="text-volt hover:underline flex items-center justify-center gap-1"
          >
            <ArrowLeft size={12} /> Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
