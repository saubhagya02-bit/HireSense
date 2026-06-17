import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { analyticsAPI } from "../services/api";
import { TrendingUp, Award, Clock, Target } from "lucide-react";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink-800 border border-white/10 rounded-xl px-3 py-2 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-volt font-mono font-700">{payload[0].value}/100</p>
    </div>
  );
};

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI
      .summary()
      .then(({ data }) => setSummary(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-volt/40 border-t-volt rounded-full animate-spin" />
      </div>
    );
  }

  const trendData =
    summary?.score_trend?.map((t: any) => ({
      date: new Date(t.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      score: t.score,
      name: t.title,
    })) ?? [];

  const skillData =
    summary?.skill_breakdown?.map((s: any) => ({
      type: s.skill.charAt(0).toUpperCase() + s.skill.slice(1),
      score: s.score,
    })) ?? [];

  return (
    <div className="p-8 animate-fade-up space-y-6">
      <div>
        <h1 className="font-display text-3xl font-700 mb-2">Analytics</h1>
        <p className="text-slate-400 text-sm">
          Track your progress and identify improvement areas
        </p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Sessions Done",
            value: summary?.completed_sessions ?? 0,
            icon: Target,
            color: "text-volt",
          },
          {
            label: "Average Score",
            value: summary?.average_score ? `${summary.average_score}` : "—",
            icon: TrendingUp,
            color: "text-blue-400",
          },
          {
            label: "Best Score",
            value: summary?.best_score ? `${summary.best_score}` : "—",
            icon: Award,
            color: "text-yellow-400",
          },
          {
            label: "Hours Practiced",
            value: summary?.total_practice_minutes
              ? `${(summary.total_practice_minutes / 60).toFixed(1)}h`
              : "0h",
            icon: Clock,
            color: "text-purple-400",
          },
        ].map(({ label, value, icon: Icon, color }) => (
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

      <div className="grid grid-cols-2 gap-6">
        {/* Score Trend */}
        <div className="card">
          <h2 className="font-display font-700 mb-5">Score Trend</h2>
          {trendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.04)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                    fontFamily: "DM Sans",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#c8f135"
                  strokeWidth={2.5}
                  dot={{ fill: "#c8f135", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: "#c8f135" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">
              Complete at least 2 sessions to see trend
            </div>
          )}
        </div>

        {/* Interview Type Breakdown */}
        <div className="card">
          <h2 className="font-display font-700 mb-5">By Interview Type</h2>
          {skillData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={skillData} barSize={36}>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.04)"
                  vertical={false}
                />
                <XAxis
                  dataKey="type"
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                    fontFamily: "DM Sans",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="score"
                  fill="#c8f135"
                  fillOpacity={0.85}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">
              Complete sessions to see breakdown
            </div>
          )}
        </div>
      </div>

      {/* Areas */}
      <div className="grid grid-cols-2 gap-6">
        {summary?.strong_areas?.length > 0 && (
          <div className="card">
            <h3 className="font-display font-700 mb-4 text-green-400">
              ✓ Strong Areas
            </h3>
            <div className="flex flex-wrap gap-2">
              {summary.strong_areas.map((s: string) => (
                <span
                  key={s}
                  className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {summary?.weak_areas?.length > 0 && (
          <div className="card">
            <h3 className="font-display font-700 mb-4 text-orange-400">
              ⚡ Focus Areas
            </h3>
            <div className="flex flex-wrap gap-2">
              {summary.weak_areas.map((s: string) => (
                <span
                  key={s}
                  className="px-3 py-1.5 bg-orange-400/10 border border-orange-400/20 text-orange-400 text-sm rounded-xl"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* All sessions table */}
      {summary?.recent_sessions?.length > 0 && (
        <div className="card">
          <h2 className="font-display font-700 mb-4">All Sessions</h2>
          <div className="space-y-2">
            {summary.recent_sessions.map((s: any) => (
              <Link
                key={s.id}
                to={`/interview/${s.id}/results`}
                className="flex items-center justify-between p-4 bg-ink-700 rounded-xl hover:bg-ink-600 transition-colors"
              >
                <div>
                  <p className="text-sm font-body font-medium text-white">
                    {s.title}
                  </p>
                  <p className="text-xs text-slate-300 capitalize mt-0.5">
                    {s.interview_type} · {s.difficulty}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-xs text-slate-400">Duration</p>
                    <p className="text-sm font-mono">
                      {s.duration_minutes ? `${s.duration_minutes}m` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Score</p>
                    <p
                      className={`text-sm font-mono font-700 ${
                        !s.overall_score
                          ? "text-slate-400"
                          : s.overall_score >= 75
                            ? "text-volt"
                            : s.overall_score >= 50
                              ? "text-yellow-400"
                              : "text-red-400"
                      }`}
                    >
                      {s.overall_score ? `${Math.round(s.overall_score)}` : "—"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!summary?.completed_sessions && (
        <div className="card text-center py-16">
          <TrendingUp size={40} className="text-slate-600 mx-auto mb-4" />
          <p className="font-display font-700 text-lg mb-2">No data yet</p>
          <p className="text-slate-400 text-sm mb-6">
            Complete interview sessions to see your analytics
          </p>
          <Link
            to="/interview/new"
            className="btn-primary inline-flex items-center gap-2"
          >
            Start Practicing
          </Link>
        </div>
      )}
    </div>
  );
}
