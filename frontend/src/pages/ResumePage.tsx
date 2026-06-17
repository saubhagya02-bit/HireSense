import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Star,
  TrendingUp,
  X,
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

export default function ResumePage() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const fetchResumes = () =>
    resumeAPI.list().then(({ data }) => {
      setResumes(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    });

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

  return (
    <div className="p-8 animate-fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-700 mb-2">Resume Analysis</h1>
        <p className="text-slate-400 text-sm">
          Upload your resume for AI-powered feedback and ATS scoring
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Upload + list */}
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
                <p className="text-sm text-volt">Analyzing with Gemini AI...</p>
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

          {/* Resume list */}
          {resumes.length > 0 && (
            <div className="card">
              <p className="text-xs text-slate-400 mb-3">Uploaded Resumes</p>
              <div className="space-y-2">
                {resumes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={clsx(
                      "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                      selected?.id === r.id
                        ? "bg-volt/10 border border-volt/20"
                        : "bg-ink-700 hover:bg-ink-600 border border-transparent",
                    )}
                  >
                    <FileText
                      size={14}
                      className={
                        selected?.id === r.id ? "text-volt" : "text-slate-400"
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body truncate">{r.filename}</p>
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
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Analysis Panel */}
        <div className="col-span-2">
          {selected ? (
            <div className="space-y-4">
              {/* ATS Score */}
              {selected.ats_score != null && (
                <div className="card">
                  <ATSMeter score={selected.ats_score} />
                </div>
              )}

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
                        <div key={i} className="border-l-2 border-volt/30 pl-3">
                          <p className="text-sm font-600">{exp.title}</p>
                          <p className="text-xs text-slate-400">
                            {exp.company} · {exp.duration}
                          </p>
                          {exp.highlights?.map((h: string, j: number) => (
                            <p key={j} className="text-xs text-slate-400 mt-1">
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
            <div className="h-full flex items-center justify-center">
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
  );
}
