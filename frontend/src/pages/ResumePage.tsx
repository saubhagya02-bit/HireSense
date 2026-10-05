import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  FileText,
  Upload,
  CheckCircle,
  Star,
  Trash2,
  AlertTriangle,
  X,
  Calendar,
} from "lucide-react";
import { resumeAPI } from "../services/api";
import toast from "react-hot-toast";
import clsx from "clsx";

function ATSMeter({ score }: { score: number }) {
  const color = score >= 75 ? "#c8f135" : score >= 50 ? "#fbbf24" : "#f87171";
  const label = score >= 75 ? "Great" : score >= 50 ? "Fair" : "Needs Work";
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">ATS Compatibility</span>
        <span style={{ color }} className="font-mono font-700">
          {Math.round(score)}/100 — {label}
        </span>
      </div>
      <div className="h-2 bg-ink-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────
function DeleteModal({
  resume,
  onConfirm,
  onCancel,
  loading,
}: {
  resume: any;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="relative w-full max-w-sm bg-ink-800 border border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-up">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/15 border border-red-500/25 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="font-display font-700 text-white">Delete Resume?</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              This cannot be undone
            </p>
          </div>
        </div>

        <div className="p-3 bg-ink-700 rounded-xl mb-5">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-slate-400 flex-shrink-0" />
            <p className="text-sm text-white truncate">{resume.filename}</p>
          </div>
          {resume.ats_score != null && (
            <p className="text-xs text-slate-400 mt-1 ml-5">
              ATS Score: {Math.round(resume.ats_score)}/100
            </p>
          )}
        </div>

        <p className="text-sm text-slate-400 mb-5 leading-relaxed">
          Deleting this resume will also remove the AI analysis and ATS score.
          Interview sessions linked to this resume won't be affected.
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
            {loading ? "Deleting..." : "Delete Resume"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function ResumePage() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchResumes = async () => {
    try {
      const { data } = await resumeAPI.list();
      setResumes(data);
      if (data.length > 0) {
        setSelected((prev: any) =>
          prev ? data.find((r: any) => r.id === prev.id) || data[0] : data[0],
        );
      } else {
        setSelected(null);
      }
    } catch {
      toast.error("Failed to load resumes");
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return;
    setUploading(true);
    try {
      const { data } = await resumeAPI.upload(files[0]);
      toast.success("Resume uploaded and analyzed!");
      await fetchResumes();
      setSelected(data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await resumeAPI.delete(deleteTarget.id);
      toast.success("Resume deleted");
      setDeleteTarget(null);
      await fetchResumes();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete resume");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteModal
          resume={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <div className="p-8 animate-fade-up">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-700 mb-2">
            Resume Analysis
          </h1>
          <p className="text-slate-400 text-sm">
            Upload your resume for AI-powered feedback and ATS scoring
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left — Upload + List */}
          <div className="space-y-4">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={clsx(
                "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
                isDragActive
                  ? "border-volt bg-volt/5"
                  : uploading
                    ? "border-white/10 opacity-60 cursor-not-allowed"
                    : "border-white/10 hover:border-volt/40 hover:bg-volt/5",
              )}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <div>
                  <div className="w-8 h-8 border-2 border-volt/40 border-t-volt rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-volt">Analyzing with AI...</p>
                </div>
              ) : (
                <div>
                  <Upload
                    size={28}
                    className={clsx(
                      "mx-auto mb-3",
                      isDragActive ? "text-volt" : "text-slate-400",
                    )}
                  />
                  <p className="text-sm font-display font-600">
                    {isDragActive ? "Drop it!" : "Drop your resume here"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    PDF, DOCX, or TXT · Max 5 MB
                  </p>
                </div>
              )}
            </div>

            {/* Resume List */}
            {resumes.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-400">
                    Uploaded Resumes ({resumes.length})
                  </p>
                </div>
                <div className="space-y-2">
                  {resumes.map((r) => (
                    <div
                      key={r.id}
                      className={clsx(
                        "flex items-center gap-2 p-3 rounded-xl border transition-all group",
                        selected?.id === r.id
                          ? "bg-volt/10 border-volt/20"
                          : "bg-ink-700 hover:bg-ink-600 border-transparent",
                      )}
                    >
                      {/* Select button */}
                      <button
                        onClick={() => setSelected(r)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      >
                        <FileText
                          size={14}
                          className={
                            selected?.id === r.id
                              ? "text-volt flex-shrink-0"
                              : "text-slate-400 flex-shrink-0"
                          }
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-body truncate text-white">
                            {r.filename}
                          </p>
                          {r.ats_score != null && (
                            <p
                              className={clsx(
                                "text-xs font-mono",
                                r.ats_score >= 75
                                  ? "text-volt"
                                  : r.ats_score >= 50
                                    ? "text-yellow-400"
                                    : "text-red-400",
                              )}
                            >
                              ATS: {Math.round(r.ats_score)}
                            </p>
                          )}
                        </div>
                      </button>

                      {/* Active badge */}
                      {r.is_active && (
                        <span className="text-xs px-1.5 py-0.5 bg-volt/10 text-volt border border-volt/20 rounded-md flex-shrink-0">
                          Active
                        </span>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteTarget(r);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0 flex-shrink-0"
                        title="Delete resume"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Analysis Panel */}
          <div className="col-span-2">
            {selected ? (
              <div className="space-y-4">
                {/* Header card */}
                <div className="card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-volt/10 border border-volt/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText size={18} className="text-volt" />
                      </div>
                      <div>
                        <p className="font-display font-700 text-base">
                          {selected.filename}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {selected.is_active && (
                            <span className="text-xs px-2 py-0.5 bg-volt/10 text-volt border border-volt/20 rounded-md">
                              Active Resume
                            </span>
                          )}
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Calendar size={11} />
                            {new Date(selected.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delete button in header */}
                    <button
                      onClick={() => setDeleteTarget(selected)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-display font-700 hover:bg-red-500/15 hover:border-red-500/40 transition-all"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>

                  {/* ATS Meter */}
                  {selected.ats_score != null && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <ATSMeter score={selected.ats_score} />
                    </div>
                  )}
                </div>

                {/* AI Feedback */}
                {selected.ai_feedback && (
                  <div className="card border-volt/20 bg-volt/5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-volt/20 flex items-center justify-center flex-shrink-0">
                        <Star size={14} className="text-volt" />
                      </div>
                      <div>
                        <h3 className="font-display font-700 mb-1.5">
                          AI Coach Feedback
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {selected.ai_feedback}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills */}
                {selected.skills?.length > 0 && (
                  <div className="card">
                    <h3 className="font-display font-700 mb-3 flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-400" />
                      Detected Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selected.skills.map((s: string) => (
                        <span
                          key={s}
                          className="text-xs px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Experience */}
                  {selected.experience?.length > 0 && (
                    <div className="card">
                      <h3 className="font-display font-700 mb-3 text-sm">
                        Experience
                      </h3>
                      <div className="space-y-3">
                        {selected.experience.map((exp: any, i: number) => (
                          <div
                            key={i}
                            className="border-l-2 border-volt/30 pl-3"
                          >
                            <p className="text-sm font-600">{exp.title}</p>
                            <p className="text-xs text-slate-400">
                              {exp.company} · {exp.duration}
                            </p>
                            {exp.highlights?.map((h: string, j: number) => (
                              <p
                                key={j}
                                className="text-xs text-slate-400 mt-1"
                              >
                                • {h}
                              </p>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {selected.education?.length > 0 && (
                    <div className="card">
                      <h3 className="font-display font-700 mb-3 text-sm">
                        Education
                      </h3>
                      <div className="space-y-3">
                        {selected.education.map((edu: any, i: number) => (
                          <div
                            key={i}
                            className="border-l-2 border-blue-400/30 pl-3"
                          >
                            <p className="text-sm font-600">{edu.degree}</p>
                            <p className="text-xs text-slate-400">
                              {edu.institution} · {edu.year}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center min-h-64">
                <div className="text-center">
                  <FileText size={48} className="text-slate-600 mx-auto mb-4" />
                  <p className="font-display font-700 text-lg mb-2">
                    No resume yet
                  </p>
                  <p className="text-slate-400 text-sm">
                    Upload a resume to get AI-powered feedback
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
