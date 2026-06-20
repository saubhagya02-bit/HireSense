import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Mic,
  FileText,
  BarChart3,
  LogOut,
  Zap,
  Settings,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import clsx from "clsx";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/interview/new", icon: Mic, label: "Practice" },
  { to: "/resume", icon: FileText, label: "Resume" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = (user?.full_name || "?")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-slate-900" strokeWidth={2.5} />
            </div>

            <span className="font-bold text-lg tracking-tight text-slate-300">
              HireSense
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Smart Interview Platform
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                  isActive
                    ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User area */}
        <div className="p-4 border-t border-white/5 space-y-1">
          {/* Avatar button → Settings */}
          <button
            onClick={() => navigate("/settings")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/8"
          >
            {/* Avatar circle */}
            <div className="w-9 h-9 rounded-xl bg-volt/20 border border-volt/30 flex items-center justify-center flex-shrink-0 group-hover:border-volt/50 transition-colors">
              <span className="text-volt text-xs font-display font-700">
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-body text-white truncate">
                {user?.full_name}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user?.target_role || "No role set"}
              </p>
            </div>
            <Settings
              size={13}
              className="text-slate-500 group-hover:text-slate-300 flex-shrink-0 transition-colors"
            />
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-transparent"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
