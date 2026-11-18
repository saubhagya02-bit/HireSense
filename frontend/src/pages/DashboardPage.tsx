import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mic,
  TrendingUp,
  Clock,
  Target,
  ArrowRight,
  Plus,
  Star,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import { analyticsAPI, interviewAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

interface Summary {
  total_sessions: number;
  completed_sessions: number;
  average_score?: number;
  best_score?: number;
  total_practice_minutes?: number;
  recent_sessions: any[];
  strong_areas: string[];
  weak_areas: string[];
}

function ScoreCircle({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? "#A855F7" : score >= 50 ? "#34D399" : "#f87171";

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={6}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={6}
        fill="none"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text
        x="50%"
        y="50%"
        dy="0.35em"
        textAnchor="middle"
        fill="white"
        fontSize={size / 5}
        fontFamily="Inter"
        fontWeight="700"
        style={{ transform: "rotate(90deg)", transformOrigin: "center" }}
      >
        {Math.round(score)}
      </text>
    </svg>
  );
}

// Delete confirmation modal
function DeleteModal({
  session,
  onConfirm,
  onCancel,
  loading,
}: {
  session: any;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm bg-ink-800 border border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-up">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/15 border border-red-500/25 rounded-xl flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="font-display font-700 text-white">Delete session?</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              This cannot be undone
            </p>
          </div>
        </div>

        <div className="p-3 bg-ink-700 rounded-xl mb-4">
          <p className="text-sm text-white font-body">{session.title}</p>
          <p className="text-xs text-slate-400 mt-0.5 capitalize">
            {session.interview_type} · {session.difficulty} · {session.status}
          </p>
        </div>

        <p className="text-sm text-slate-400 mb-5 leading-relaxed">
          All questions, answers, and AI feedback for this session will be
          permanently deleted.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 btn-ghost text-sm py-2.5"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/40 bg-red-500/15 text-red-400 text-sm font-display font-700 hover:bg-red-500/25 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            {loading ? "Deleting..." : "Delete session"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSummary = () =>
    analyticsAPI
      .summary()
      .then(({ data }) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await interviewAPI.delete(deleteTarget.id);
      toast.success("Session deleted");
      setDeleteTarget(null);
      await fetchSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete session");
    } finally {
      setDeleting(false);
    }
  };

  const statCards = [
    {
      label: "Sessions",
      value: summary?.total_sessions ?? 0,
      icon: Mic,
      color: "text-volt",
    },
    {
      label: "Avg Score",
      value: summary?.average_score ? `${summary.average_score}` : "—",
      icon: TrendingUp,
      color: "text-blue-400",
    },
    {
      label: "Best Score",
      value: summary?.best_score ? `${summary.best_score}` : "—",
      icon: Star,
      color: "text-yellow-400",
    },
    {
      label: "Mins Practiced",
      value: summary?.total_practice_minutes ?? 0,
      icon: Clock,
      color: "text-purple-400",
    },
  ];

  return (
    <>
      {deleteTarget && (
        <DeleteModal
          session={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <div className="p-8 space-y-8 animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-700">
              Good to see you,{" "}
              <span className="text-volt">
                {user?.full_name?.split(" ")[0]}
              </span>
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              {user?.target_role
                ? `Preparing for: ${user.target_role}`
                : "Set your target role in your profile"}
            </p>
          </div>
          <Link
            to="/interview/new"
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            New Practice
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className={`${color} bg-white/5 p-2.5 rounded-xl`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-display font-700">{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Recent Sessions */}
          <div className="col-span-2 card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-700 text-lg">Recent Sessions</h2>
              <Link
                to="/analytics"
                className="text-xs text-volt flex items-center gap-1 hover:underline"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-ink-700 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : summary?.recent_sessions?.length ? (
              <div className="space-y-3">
                {summary.recent_sessions.map((s: any) => {
                  const href =
                    s.status === "completed"
                      ? `/interview/${s.id}/results`
                      : `/interview/${s.id}`;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 p-4 bg-ink-700 rounded-xl hover:bg-ink-600 transition-colors group"
                    >
                      {/* Clickable area */}
                      <Link
                        to={href}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <div className="w-10 h-10 rounded-xl bg-volt/10 flex items-center justify-center flex-shrink-0">
                          <Mic size={16} className="text-volt" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-body font-medium text-white truncate">
                            {s.title}
                          </p>
                          <p className="text-xs text-slate-300 capitalize">
                            {s.interview_type} · {s.difficulty} · {s.status}
                          </p>
                        </div>
                      </Link>

                      {/* Score + actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {s.overall_score != null && (
                          <ScoreCircle score={s.overall_score} size={44} />
                        )}

                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                          title="Delete session"
                          aria-label={`Delete ${s.title}`}
                        >
                          <Trash2 size={16} />
                        </button>

                        <Link
                          to={href}
                          className="text-slate-400 group-hover:text-volt transition-colors"
                          aria-label="Open session"
                        >
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Mic size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No sessions yet</p>
                <Link
                  to="/interview/new"
                  className="text-volt text-sm hover:underline mt-1 inline-block"
                >
                  Start your first practice →
                </Link>
              </div>
            )}
          </div>

          {/* Skills Panel */}
          <div className="space-y-4">
            {summary?.strong_areas?.length ? (
              <div className="card">
                <h3 className="font-display font-700 mb-3 flex items-center gap-2">
                  <Target size={16} className="text-volt" />
                  Strong Areas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {summary.strong_areas.map((s) => (
                    <span
                      key={s}
                      className="text-xs px-2.5 py-1 bg-volt/10 text-volt rounded-lg border border-volt/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {summary?.weak_areas?.length ? (
              <div className="card">
                <h3 className="font-display font-700 mb-3 flex items-center gap-2">
                  <TrendingUp size={16} className="text-orange-400" />
                  To Improve
                </h3>
                <div className="flex flex-wrap gap-2">
                  {summary.weak_areas.map((s) => (
                    <span
                      key={s}
                      className="text-xs px-2.5 py-1 bg-orange-400/10 text-orange-400 rounded-lg border border-orange-400/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="card bg-gradient-to-br from-volt/10 to-transparent border-volt/20">
              <h3 className="font-display font-700 mb-2">Quick Start</h3>
              <p className="text-xs text-slate-400 mb-4">
                Jump into a 5-question mock interview right now
              </p>
              <Link
                to="/interview/new"
                className="btn-primary text-sm w-full block text-center"
              >
                Start Interview →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}