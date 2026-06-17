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
} from "lucide-react";
import { analyticsAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

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
  const color = score >= 75 ? "#c8f135" : score >= 50 ? "#fbbf24" : "#f87171";

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
        fontFamily="Syne"
        fontWeight="700"
        style={{ transform: "rotate(90deg)", transformOrigin: "center" }}
      >
        {Math.round(score)}
      </text>
    </svg>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI
      .summary()
      .then(({ data }) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

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
    <div className="p-8 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-700">
            Good to see you,{" "}
            <span className="text-volt">{user?.full_name?.split(" ")[0]}</span>
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
              {summary.recent_sessions.map((s: any) => (
                <Link
                  key={s.id}
                  to={
                    s.status === "completed"
                      ? `/interview/${s.id}/results`
                      : `/interview/${s.id}`
                  }
                  className="flex items-center justify-between p-4 bg-ink-700 rounded-xl hover:bg-ink-600 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-volt/10 flex items-center justify-center">
                      <Mic size={16} className="text-volt" />
                    </div>
                    <div>
                      <p className="text-sm font-body font-medium text-white">
                        {s.title}
                      </p>
                      <p className="text-xs text-slate-300 capitalize">
                        {s.interview_type} · {s.difficulty} · {s.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.overall_score != null && (
                      <ScoreCircle score={s.overall_score} size={44} />
                    )}
                    <ArrowRight
                      size={14}
                      className="text-slate-400 group-hover:text-volt transition-colors"
                    />
                  </div>
                </Link>
              ))}
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
  );
}
