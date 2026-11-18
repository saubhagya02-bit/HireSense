import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Keyboard,
  Send,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { interviewAPI } from "../services/api";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import toast from "react-hot-toast";
import clsx from "clsx";

type AnswerMode = "speak" | "type";

export default function InterviewPage() {
  const { id } = useParams<{ id: string }>();
  const sessionId = Number(id?.replace(":", ""));
  const navigate = useNavigate();

  const [session, setSession] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Answer mode: speak or type
  const [mode, setMode] = useState<AnswerMode>("speak");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const questionStartRef = useRef<Record<number, number>>({});

  const {
    isRecording,
    transcript,
    interimTranscript,
    error,
    startRecording,
    stopRecording,
    reset: resetVoice,
  } = useVoiceRecorder();

  // Load session
  useEffect(() => {
    interviewAPI.get(sessionId).then(({ data }) => {
      setSession(data);
      if (data.status === "pending") {
        interviewAPI
          .start(sessionId)
          .then(({ data: started }) => setSession(started));
      }
    });
  }, [sessionId]);

  // Elapsed timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const currentQuestion = session?.questions?.[currentIdx];
  const totalQ = session?.questions?.length ?? 0;
  const isAnswered = currentQuestion && answers[currentQuestion.id];

  // Remember when each question was first shown (used as typing duration)
  useEffect(() => {
    if (currentQuestion && !questionStartRef.current[currentQuestion.id]) {
      questionStartRef.current[currentQuestion.id] = Date.now();
    }
  }, [currentQuestion]);

  const typedText: string = currentQuestion
    ? (drafts[currentQuestion.id] ?? "")
    : "";
  const wordCount = typedText.trim() ? typedText.trim().split(/\s+/).length : 0;

  const setDraft = (value: string) => {
    if (!currentQuestion) return;
    setDrafts((d) => ({ ...d, [currentQuestion.id]: value }));
  };

  // Shared submit for both modes
  const submitAnswer = async (
    text: string,
    durationSeconds: number,
    inputMode: "voice" | "typed",
  ): Promise<boolean> => {
    setSubmitting(true);
    try {
      const { data } = await interviewAPI.submitAnswer(sessionId, {
        question_id: currentQuestion.id,
        transcribed_text: text,
        duration_seconds: durationSeconds,
        input_mode: inputMode,
      });
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: data }));
      toast.success("Answer recorded!");
      return true;
    } catch {
      toast.error("Failed to submit answer");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleStopAndSubmit = async () => {
    setSubmitting(true);
    const { transcript: finalText, durationSeconds } = await stopRecording();
    if (!finalText.trim()) {
      setSubmitting(false);
      toast.error("No speech detected. Try again.");
      return;
    }
    await submitAnswer(finalText, durationSeconds, "voice");
  };

  const handleSubmitTyped = async () => {
    if (!typedText.trim()) {
      toast.error("Type your answer first.");
      return;
    }
    const started =
      questionStartRef.current[currentQuestion.id] ?? Date.now();
    const seconds = Math.max((Date.now() - started) / 1000, 1);

    const ok = await submitAnswer(typedText.trim(), seconds, "typed");
    if (ok) setDraft("");
  };

  const handleNext = () => {
    resetVoice();
    if (currentIdx < totalQ - 1) {
      setCurrentIdx((i) => i + 1);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await interviewAPI.complete(sessionId);
      toast.success("Interview complete! Generating your report...");
      navigate(`/interview/${sessionId}/results`);
    } catch {
      toast.error("Failed to complete session");
    } finally {
      setCompleting(false);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-volt/40 border-t-volt rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading interview...</p>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progress = totalQ ? (answeredCount / totalQ) * 100 : 0;
  const allAnswered = answeredCount === totalQ;

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-700 text-lg text-white">
            {session.title}
          </h1>
          <p className="text-xs text-slate-400 capitalize">
            {session.interview_type} · {session.difficulty} ·{" "}
            {session.target_role}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-400 text-sm">
            <Clock size={14} />
            <span className="font-mono">{formatTime(elapsed)}</span>
          </div>
          <span className="text-sm text-slate-400">
            {answeredCount}/{totalQ} answered
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-ink-700 rounded-full mb-6">
        <div
          className="h-full bg-volt rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Question sidebar */}
        <div className="w-48 flex-shrink-0 space-y-1.5">
          {session.questions.map((q: any, i: number) => (
            <button
              key={q.id}
              onClick={() => {
                setCurrentIdx(i);
                resetVoice();
              }}
              className={clsx(
                "w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all",
                i === currentIdx
                  ? "bg-volt/20 text-white border border-volt/40"
                  : answers[q.id]
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "text-slate-400 hover:bg-white/5 border border-transparent",
              )}
            >
              <div className="flex items-center gap-2">
                {answers[q.id] ? (
                  <CheckCircle size={12} />
                ) : (
                  <span className="w-3 font-mono">{i + 1}</span>
                )}
                <span className="truncate">
                  Q{i + 1}: {q.question_type}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Main interview area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {currentQuestion && (
            <>
              {/* Question card */}
              <div className="card flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 bg-volt/10 text-volt rounded-md border border-volt/20 font-mono">
                    Q{currentIdx + 1}
                  </span>
                  <span className="text-xs text-slate-400 capitalize">
                    {currentQuestion.question_type}
                  </span>
                  <span className="text-xs text-slate-400 capitalize">
                    · {currentQuestion.difficulty}
                  </span>
                </div>
                <p className="font-body text-base leading-relaxed text-white">
                  {currentQuestion.question_text}
                </p>

                {currentQuestion.expected_topics?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-xs text-slate-400 mb-1.5">
                      Key topics to cover:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {currentQuestion.expected_topics.map((t: string) => (
                        <span
                          key={t}
                          className="text-xs px-2 py-0.5 bg-white/10 text-slate-200 border border-white/10 rounded-md"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Answer area */}
              <div className="card flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-400">Your answer</p>

                  <div className="flex items-center gap-3">
                    {mode === "speak" && isRecording && (
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5 items-end h-4">
                          {[...Array(8)].map((_, i) => (
                            <div
                              key={i}
                              className="waveform-bar"
                              style={{ height: `${20 + Math.random() * 60}%` }}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-volt">Recording...</span>
                      </div>
                    )}

                    {/* Speak / Type toggle */}
                    {!isAnswered && (
                      <div className="flex items-center gap-1 p-1 bg-ink-700 rounded-xl">
                        {(
                          [
                            ["speak", Mic, "Speak"],
                            ["type", Keyboard, "Type"],
                          ] as const
                        ).map(([key, Icon, label]) => (
                          <button
                            key={key}
                            onClick={() => setMode(key)}
                            disabled={isRecording || submitting}
                            className={clsx(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-600 transition-all disabled:opacity-50",
                              mode === key
                                ? "bg-volt/20 text-volt"
                                : "text-slate-400 hover:text-white",
                            )}
                          >
                            <Icon size={13} />
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {mode === "type" && !isAnswered ? (
                  <textarea
                    value={typedText}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                        e.preventDefault();
                        handleSubmitTyped();
                      }
                    }}
                    disabled={submitting}
                    placeholder="Type your answer here..."
                    className="flex-1 w-full resize-none bg-ink-700 border border-white/10 rounded-xl p-4 text-sm leading-relaxed text-white outline-none focus:border-volt/40 transition-colors disabled:opacity-60"
                  />
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    {transcript || interimTranscript ? (
                      <p className="text-sm leading-relaxed font-body text-white">
                        {transcript}
                        {interimTranscript && (
                          <span className="text-slate-400">
                            {interimTranscript}
                          </span>
                        )}
                      </p>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                        {isAnswered ? (
                          <div className="text-center">
                            <CheckCircle
                              size={24}
                              className="text-green-400 mx-auto mb-2"
                            />
                            <p className="text-green-400 text-sm">
                              Answer submitted
                            </p>
                            {isAnswered.ai_feedback && (
                              <p className="text-xs text-slate-400 mt-2 max-w-sm">
                                {isAnswered.ai_feedback}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p>Press the mic button to start speaking...</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {error && mode === "speak" && (
                  <div className="flex items-center gap-2 text-red-400 text-xs mt-2">
                    <AlertCircle size={12} />
                    {error}
                  </div>
                )}

                {/* Controls */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                  {!isAnswered ? (
                    mode === "speak" ? (
                      <>
                        <button
                          onClick={
                            isRecording ? handleStopAndSubmit : startRecording
                          }
                          disabled={submitting}
                          className={clsx(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-display font-600 text-sm transition-all",
                            isRecording
                              ? "bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30"
                              : "bg-volt/10 border border-volt/30 text-volt hover:bg-volt/20",
                          )}
                        >
                          {submitting ? (
                            <div className="w-4 h-4 border-2 border-volt/30 border-t-volt rounded-full animate-spin" />
                          ) : isRecording ? (
                            <MicOff size={16} />
                          ) : (
                            <Mic size={16} />
                          )}
                          {submitting
                            ? "Analyzing..."
                            : isRecording
                              ? "Stop & Submit"
                              : "Start Recording"}
                        </button>

                        {(transcript || interimTranscript) && !isRecording && (
                          <button
                            onClick={resetVoice}
                            className="btn-ghost text-sm py-2.5"
                          >
                            Retry
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleSubmitTyped}
                          disabled={submitting || !typedText.trim()}
                          className="btn-primary text-sm py-2.5 flex items-center gap-2 disabled:opacity-50"
                        >
                          {submitting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Send size={14} />
                          )}
                          {submitting ? "Analyzing..." : "Submit Answer"}
                        </button>

                        {typedText && !submitting && (
                          <button
                            onClick={() => setDraft("")}
                            className="btn-ghost text-sm py-2.5"
                          >
                            Clear
                          </button>
                        )}

                        <span className="text-xs text-slate-500">
                          {wordCount} word{wordCount !== 1 ? "s" : ""} · Ctrl+Enter
                          to submit
                        </span>
                      </>
                    )
                  ) : (
                    <div className="flex items-center gap-2">
                      {isAnswered.overall_score != null && (
                        <span className="px-3 py-1.5 bg-volt/10 text-volt border border-volt/20 rounded-lg text-sm font-mono">
                          {Math.round(isAnswered.overall_score)}/100
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex-1" />

                  {isAnswered && currentIdx < totalQ - 1 && (
                    <button
                      onClick={handleNext}
                      className="btn-primary text-sm py-2.5 flex items-center gap-1.5"
                    >
                      Next Question <ChevronRight size={14} />
                    </button>
                  )}

                  {allAnswered && (
                    <button
                      onClick={handleComplete}
                      disabled={completing}
                      className="btn-primary text-sm py-2.5 flex items-center gap-1.5"
                    >
                      {completing
                        ? "Generating report..."
                        : "Complete Interview →"}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}