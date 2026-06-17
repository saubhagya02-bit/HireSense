import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle,
  Mic,
  ArrowLeft,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { interviewAPI } from "../services/api";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import clsx from "clsx";

function ScoreRing({
  score,
  label,
  size = 100,
}: {
  score: number;
  label: string;
  size?: number;
}) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? "#c8f135" : score >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={8}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={8}
            fill="none"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-800 text-xl">
            {Math.round(score)}
          </span>
        </div>
      </div>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    interviewAPI.get(Number(id)).then(({ data }) => setSession(data));
  }, [id]);

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-volt/40 border-t-volt rounded-full animate-spin" />
      </div>
    );
  }

  const radarData = [
    { subject: "Technical", A: session.technical_score ?? 0 },
    { subject: "Communication", A: session.communication_score ?? 0 },
    { subject: "Confidence", A: session.confidence_score ?? 0 },
    {
      subject: "Relevance",
      A:
        session.answers?.reduce(
          (acc: number, a: any) => acc + (a.relevance_score ?? 0),
          0,
        ) / Math.max(session.answers?.length, 1),
    },
    {
      subject: "Clarity",
      A:
        session.answers?.reduce(
          (acc: number, a: any) => acc + (a.clarity_score ?? 0),
          0,
        ) / Math.max(session.answers?.length, 1),
    },
  ].map((d) => ({ ...d, A: Math.round(d.A) }));

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-up space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-slate-400 text-sm hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-700 mb-1">
              {session.title}
            </h1>
            <p className="text-slate-400 text-sm capitalize">
              {session.interview_type} · {session.difficulty} ·{" "}
              {session.target_role}
            </p>
          </div>
          <div className="text-right">
            <div className="font-display text-5xl font-800 text-volt">
              {Math.round(session.overall_score ?? 0)}
            </div>
            <div className="text-xs text-slate-400">Overall Score</div>
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card col-span-1 flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-6">
            <ScoreRing score={session.technical_score ?? 0} label="Technical" />
            <ScoreRing
              score={session.communication_score ?? 0}
              label="Communication"
            />
            <ScoreRing
              score={session.confidence_score ?? 0}
              label="Confidence"
            />
          </div>
        </div>

        <div className="card col-span-3">
          <h3 className="font-display font-700 mb-4">Performance Radar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "DM Sans" }}
              />
              <Radar
                name="Score"
                dataKey="A"
                stroke="#c8f135"
                fill="#c8f135"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Summary */}
      {session.ai_summary && (
        <div className="card border-volt/20 bg-volt/5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-volt/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageSquare size={14} className="text-volt" />
            </div>
            <div>
              <h3 className="font-display font-700 mb-1.5">AI Coach Summary</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {session.ai_summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {session.recommendations?.length > 0 && (
        <div className="card">
          <h3 className="font-display font-700 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-volt" />
            Recommendations
          </h3>
          <div className="space-y-2.5">
            {session.recommendations.map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-volt/10 text-volt text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-mono">
                  {i + 1}
                </span>
                <p className="text-sm text-slate-300 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-question breakdown */}
      <div className="card">
        <h3 className="font-display font-700 mb-4">Question Breakdown</h3>
        <div className="space-y-4">
          {session.questions?.map((q: any, i: number) => {
            const answer = session.answers?.find(
              (a: any) => a.question_id === q.id,
            );
            return (
              <div
                key={q.id}
                className="p-4 bg-ink-800 rounded-xl border border-white/10 text-white"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <p className="text-xs text-slate-300 mb-1">
                      Q{i + 1} · {q.question_type}
                    </p>

                    <p className="text-sm text-white font-medium">
                      {q.question_text}
                    </p>
                  </div>

                  {answer?.overall_score != null && (
                    <span
                      className={clsx(
                        "text-sm font-mono font-700 px-3 py-1 rounded-lg flex-shrink-0",
                        answer.overall_score >= 75
                          ? "bg-volt/10 text-volt"
                          : answer.overall_score >= 50
                            ? "bg-yellow-400/10 text-yellow-400"
                            : "bg-red-400/10 text-red-400",
                      )}
                    >
                      {Math.round(answer.overall_score)}/100
                    </span>
                  )}
                </div>
                {answer && (
                  <>
                    {answer.transcribed_text && (
                      <div className="p-3 bg-ink-700 border border-white/10 rounded-lg mb-3">
                        <p className="text-xs text-slate-400 mb-1">
                          Your answer:
                        </p>
                        <p className="text-xs text-white leading-relaxed">
                          {answer.transcribed_text}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        ["Relevance", answer.relevance_score],
                        ["Completeness", answer.completeness_score],
                        ["Clarity", answer.clarity_score],
                        ["Accuracy", answer.technical_accuracy],
                      ].map(
                        ([label, val]) =>
                          val != null && (
                            <div key={String(label)} className="text-center">
                              <div className="text-sm font-mono font-700 text-white">
                                {Math.round(Number(val))}
                              </div>
                              <div className="text-xs text-slate-400">
                                {label}
                              </div>
                            </div>
                          ),
                      )}
                    </div>

                    {answer.ai_feedback && (
                      <p className="text-xs text-slate-300 italic border-l-2 border-volt/30 pl-3">
                        {answer.ai_feedback}
                      </p>
                    )}

                    <div className="flex gap-4 mt-3">
                      {answer.keywords_mentioned?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {answer.keywords_mentioned.map((k: string) => (
                            <span
                              key={k}
                              className="text-xs px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded"
                            >
                              ✓ {k}
                            </span>
                          ))}
                        </div>
                      )}
                      {answer.missing_keywords?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {answer.missing_keywords.map((k: string) => (
                            <span
                              key={k}
                              className="text-xs px-1.5 py-0.5 bg-red-400/10 text-red-400 rounded"
                            >
                              ✗ {k}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="flex gap-4">
        <Link
          to="/interview/new"
          className="btn-primary flex items-center gap-2"
        >
          <Mic size={16} />
          Practice Again
        </Link>
        <Link to="/analytics" className="btn-ghost flex items-center gap-2">
          <TrendingUp size={16} />
          View Analytics
        </Link>
      </div>
    </div>
  );
}
