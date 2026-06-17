import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Code, Users, Layers, Shuffle, ChevronRight } from "lucide-react";
import { interviewAPI, resumeAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import clsx from "clsx";

const TYPES = [
  {
    id: "technical",
    label: "Technical",
    icon: Code,
    desc: "Data structures, algorithms, system design",
  },
  {
    id: "behavioral",
    label: "Behavioral",
    icon: Users,
    desc: "STAR method, soft skills, scenarios",
  },
  {
    id: "system_design",
    label: "System Design",
    icon: Layers,
    desc: "Architecture, scalability, trade-offs",
  },
  {
    id: "mixed",
    label: "Mixed",
    icon: Shuffle,
    desc: "Combination of all types",
  },
];

const DIFFICULTIES = [
  {
    id: "beginner",
    label: "Beginner",
    color: "text-slate-900 border-slate-400 bg-slate-200",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    color: "text-yellow-950 border-yellow-400 bg-yellow-100",
  },
  {
    id: "advanced",
    label: "Advanced",
    color: "text-red-950 border-red-400 bg-red-100",
  },
];

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    interview_type: "technical",
    difficulty: "intermediate",
    target_role: user?.target_role || "",
    total_questions: 5,
    resume_id: null as number | null,
  });

  useEffect(() => {
    resumeAPI
      .list()
      .then(({ data }) => setResumes(data))
      .catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast.error("Give your session a title");
      return;
    }
    setLoading(true);
    try {
      const { data } = await interviewAPI.create(form);
      toast.success("Session created! Questions are ready.");
      navigate(`/interview/${data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto animate-fade-up text-slate-800">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2 text-slate-900">
          Set up your interview
        </h1>
        <p className="text-slate-500 text-sm">
          Configure the session and Gemini will generate tailored questions
        </p>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div className="card">
          <label className="block text-sm font-display font-semibold mb-3 text-slate-800">
            Session Title
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Google SWE Practice Round 1"
            className="w-full bg-ink-700 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 outline-none focus:border-volt/40 transition-colors"
          />
        </div>

        {/* Interview Type */}
        <div className="card">
          <label className="block text-sm font-display font-semibold mb-3 text-slate-800">
            Interview Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {TYPES.map(({ id, label, icon: Icon, desc }) => {
              const isActive = form.interview_type === id;
              return (
                <button
                  key={id}
                  onClick={() => setForm({ ...form, interview_type: id })}
                  className={clsx(
                    "p-4 rounded-xl border text-left transition-all",
                    isActive
                      ? "border-volt/50 bg-volt/10" 
                      : "border-white/5 bg-ink-700 hover:border-white/20",
                  )}
                >
                  <Icon
                    size={18}
                    className={isActive ? "text-volt" : "text-slate-400"}
                  />
                  <p
                    className={clsx(
                      "font-display font-semibold text-sm mt-2",
                      isActive ? "text-slate-900 font-bold" : "text-white"
                    )}
                  >
                    {label}
                  </p>
                  <p
                    className={clsx(
                      "text-xs mt-0.5",
                      isActive ? "text-slate-700" : "text-slate-400"
                    )}
                  >
                    {desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty */}
        <div className="card">
          <label className="block text-sm font-display font-semibold mb-3 text-slate-800">
            Difficulty
          </label>
          <div className="flex gap-3">
            {DIFFICULTIES.map(({ id, label, color }) => (
              <button
                key={id}
                onClick={() => setForm({ ...form, difficulty: id })}
                className={clsx(
                  "flex-1 py-2.5 rounded-xl border text-sm font-display font-semibold transition-all",
                  form.difficulty === id
                    ? color
                    : "border-white/10 text-slate-300 bg-ink-800 hover:border-white/30 hover:bg-ink-700",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Config row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <label className="block text-xs text-slate-700 mb-2 font-semibold">
              Target Role
            </label>
            <input
              value={form.target_role}
              onChange={(e) =>
                setForm({ ...form, target_role: e.target.value })
              }
              placeholder="e.g. Backend Engineer"
              className="w-full bg-ink-700 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:border-volt/40"
            />
          </div>
          <div className="card">
            <label className="block text-xs text-slate-700 mb-2 font-semibold">
              Number of Questions
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={3}
                max={15}
                value={form.total_questions}
                onChange={(e) =>
                  setForm({ ...form, total_questions: +e.target.value })
                }
                className="flex-1 accent-volt"
              />
              <span className="font-display font-bold text-volt text-lg w-6">
                {form.total_questions}
              </span>
            </div>
          </div>
        </div>

        {/* Resume */}
        {resumes.length > 0 && (
          <div className="card">
            <label className="block text-sm font-display font-semibold mb-3 text-slate-800">
              Link Resume{" "}
              <span className="text-slate-500 font-normal text-xs">
                (optional — improves question relevance)
              </span>
            </label>
            <select
              value={form.resume_id ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  resume_id: e.target.value ? +e.target.value : null,
                })
              }
              className="w-full bg-ink-700 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-volt/40"
            >
              <option value="" className="bg-ink-800 text-slate-300">No resume</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id} className="bg-ink-800 text-white">
                  {r.filename}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 text-base py-4 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold transition-colors"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Gemini is generating questions...
            </>
          ) : (
            <>
              <Mic size={18} />
              Create Interview Session
              <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}