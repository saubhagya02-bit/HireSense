import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  ShieldCheck,
  Trash2,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Briefcase,
  Clock,
  Mail,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { userAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import clsx from "clsx";

type Tab = "profile" | "security" | "danger";

const ROLES = [
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "DevOps Engineer",
  "Data Engineer",
  "ML Engineer",
  "Mobile Developer",
  "Software Architect",
  "Engineering Manager",
  "Other",
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, setAuth, token, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const [profile, setProfile] = useState({
    full_name: user?.full_name || "",
    target_role: user?.target_role || "",
    experience_years: user?.experience_years ?? 0,
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await userAPI.updateProfile(profile);
      setAuth(data, token!);
      setProfileSaved(true);
      toast.success("Profile updated!");
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.new_password !== passwords.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwords.new_password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSavingPassword(true);
    try {
      await userAPI.changePassword(
        passwords.current_password,
        passwords.new_password
      );
      toast.success("Password changed!");
      setPasswords({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.email) {
      toast.error("Email doesn't match");
      return;
    }

    setDeleting(true);
    try {
      await userAPI.deleteAccount();
      logout();
      navigate("/login");
      toast.success("Account deleted");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-100 p-8 max-w-3xl mx-auto">

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
        </button>

        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-slate-500 text-sm">
            Manage your profile and security
          </p>
        </div>
      </div>

      <div className="flex gap-6">

        {/* SIDEBAR */}
        <div className="w-44 space-y-1">
          {[
            { id: "profile", icon: User, label: "Profile" },
            { id: "security", icon: ShieldCheck, label: "Security" },
            { id: "danger", icon: Trash2, label: "Danger Zone" },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as Tab)}
              className={clsx(
                "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm border",
                activeTab === id
                  ? "bg-yellow-400/10 text-yellow-500 border-yellow-400/20"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200 border-transparent"
              )}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1">

          {/* PROFILE */}
          {activeTab === "profile" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-white space-y-4">

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center">
                  <span className="text-yellow-400 font-bold text-xl">
                    {initials || "?"}
                  </span>
                </div>

                <div>
                  <p className="font-bold">{profile.full_name}</p>
                  <p className="text-sm text-slate-400">{user?.email}</p>
                  <p className="text-xs text-slate-500">
                    {profile.target_role || "No role set"}
                  </p>
                </div>
              </div>

              {/* FORM */}
              <form onSubmit={handleSaveProfile} className="space-y-4">

                {/* NAME */}
                <input
                  value={profile.full_name}
                  onChange={(e) =>
                    setProfile({ ...profile, full_name: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-yellow-400 outline-none"
                  placeholder="Full Name"
                />

                {/* ROLE */}
                <select
                  value={profile.target_role}
                  onChange={(e) =>
                    setProfile({ ...profile, target_role: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-yellow-400 outline-none"
                >
                  <option value="">Select role</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {/* EXPERIENCE */}
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={profile.experience_years}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      experience_years: +e.target.value,
                    })
                  }
                  className="w-full accent-yellow-400"
                />

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full bg-yellow-400 text-slate-900 font-semibold py-3 rounded-xl hover:bg-yellow-300"
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          )}

          {/* SECURITY */}
          {activeTab === "security" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-white space-y-4">

              <input
                type={showCurrent ? "text" : "password"}
                value={passwords.current_password}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    current_password: e.target.value,
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3"
                placeholder="Current Password"
              />

              <input
                type={showNew ? "text" : "password"}
                value={passwords.new_password}
                onChange={(e) =>
                  setPasswords({ ...passwords, new_password: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3"
                placeholder="New Password"
              />

              <input
                type={showNew ? "text" : "password"}
                value={passwords.confirm_password}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    confirm_password: e.target.value,
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3"
                placeholder="Confirm Password"
              />

              <button
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="w-full bg-yellow-400 text-slate-900 font-semibold py-3 rounded-xl hover:bg-yellow-300"
              >
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          )}

          {/* DANGER */}
          {activeTab === "danger" && (
            <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 shadow-xl text-white">

              <p className="text-red-400 font-bold mb-2">Danger Zone</p>

              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full bg-slate-800 border border-red-500/20 rounded-xl px-4 py-3 mb-4"
                placeholder="Type your email to confirm"
              />

              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600"
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}