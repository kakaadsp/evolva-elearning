"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TopNav from "@/components/layout/TopNav";
import toast from "react-hot-toast";
import {
  Brain,
  CheckCircle,
  Clock,
  Eye,
  X,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  User,
  FileText,
  Star,
  Save,
} from "lucide-react";
import type { LKPDSubmission, AIFeedback } from "@/types";

type SubmissionWithRelations = LKPDSubmission & {
  student?: { full_name?: string; email?: string } | null;
  lkpd: {
    title: string;
    questions: Array<{
      id: string;
      question_text: string;
      max_points: number;
      rubric_hint?: string;
    }>;
    max_score: number;
  };
};

function GradingContent() {
  const [submissions, setSubmissions] = useState<SubmissionWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<SubmissionWithRelations | null>(null);
  const [grading, setGrading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [teacherNotes, setTeacherNotes] = useState("");
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "ai_graded" | "validated">("all");

  const searchParams = useSearchParams();
  const lkpdIdParam = searchParams.get("lkpdId");

  const fetchSubmissions = useCallback(async (selectedIdToKeep?: string) => {
    setLoading(true);
    try {
      const url = lkpdIdParam
        ? `/api/guru/grading?lkpdId=${encodeURIComponent(lkpdIdParam)}`
        : "/api/guru/grading";
      const res = await fetch(url);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      const data: SubmissionWithRelations[] = result.submissions || [];
      setSubmissions(data);

      setSelectedSub((prev) => {
        const targetId = selectedIdToKeep || prev?.id;
        if (!targetId) {
          return data.length > 0 ? data[0] : null;
        }
        return data.find((s) => s.id === targetId) || prev || (data.length > 0 ? data[0] : null);
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memuat daftar tugas");
    } finally {
      setLoading(false);
    }
  }, [lkpdIdParam]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const filtered = submissions.filter(
    (s) => statusFilter === "all" || s.status === statusFilter
  );

  async function runAIGrading(sub: SubmissionWithRelations) {
    if (!sub.lkpd?.questions) return;
    setGrading(true);
    try {
      const res = await fetch("/api/ai/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: sub.id,
          lkpd_title: sub.lkpd.title,
          questions: sub.lkpd.questions,
          answers: sub.answers,
          student_name: sub.student?.full_name || "Mahasiswa",
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menghubungi Groq AI");
      toast.success("✦ Groq AI berhasil mengoreksi tugas!");

      setSelectedSub((prev) =>
        prev
          ? {
              ...prev,
              status: "ai_graded",
              ai_score: result.feedback?.total_score,
              ai_feedback: result.feedback,
              answers: result.answers || prev.answers,
            }
          : null
      );
      if (result.feedback?.total_score !== undefined) {
        setFinalScore(result.feedback.total_score);
      }
      fetchSubmissions(sub.id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menghubungi Groq AI");
      fetchSubmissions(sub.id);
    } finally {
      setGrading(false);
    }
  }

  async function validateScore() {
    if (!selectedSub) return;
    setValidating(true);
    try {
      const res = await fetch("/api/guru/grading", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: selectedSub.id,
          final_score: finalScore,
          teacher_notes: teacherNotes,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan nilai");

      const studentName = selectedSub.student?.full_name || "Mahasiswa";
      toast.success(`Nilai ${studentName} berhasil divalidasi: ${finalScore} poin`);

      setSelectedSub((prev) =>
        prev
          ? {
              ...prev,
              status: "validated",
              final_score: finalScore,
              teacher_notes: teacherNotes,
            }
          : null
      );
      fetchSubmissions(selectedSub.id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan nilai");
    } finally {
      setValidating(false);
    }
  }

  function openDetail(sub: SubmissionWithRelations) {
    setSelectedSub(sub);
    setFinalScore(sub.ai_score ?? sub.final_score ?? 0);
    setTeacherNotes(sub.teacher_notes ?? "");
    setExpandedAnswers({});
  }

  const aiFeedback = selectedSub?.ai_feedback as AIFeedback | undefined;

  const statusInfo = {
    submitted: { label: "Menunggu", class: "badge-warning", icon: Clock },
    ai_grading: { label: "Dikoreksi AI...", class: "badge-ai", icon: Brain },
    ai_graded: { label: "Selesai AI", class: "badge-ai", icon: Sparkles },
    validated: { label: "Tervalidasi", class: "badge-success", icon: CheckCircle },
  };

  return (
    <div>
      <TopNav
        title="Koreksi AI & Validasi Nilai"
        breadcrumbs={[
          { label: "Guru", href: "/dashboard/guru" },
          { label: "Koreksi AI" },
        ]}
      />

      <div className="p-6 flex gap-6" style={{ minHeight: "calc(100vh - 64px)" }}>
        {/* Submission list */}
        <div className={`${selectedSub ? "hidden lg:flex" : "flex"} flex-col gap-4 ${selectedSub ? "w-80 shrink-0" : "flex-1"}`}>
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "submitted", "ai_graded", "validated"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === f
                    ? "bg-primary-600 text-white"
                    : "bg-white border border-neutral-200 text-neutral-600 hover:border-primary-300"
                }`}
                id={`filter-${f}`}
              >
                {f === "all" ? "Semua" : f === "submitted" ? "Menunggu" : f === "ai_graded" ? "Selesai AI" : "Tervalidasi"}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex flex-col gap-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card-flat rounded-2xl p-4">
                  <div className="skeleton h-4 w-3/4 mb-2" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((sub) => {
                const info = statusInfo[sub.status as keyof typeof statusInfo];
                const InfoIcon = info?.icon || Clock;
                return (
                  <button
                    key={sub.id}
                    onClick={() => openDetail(sub)}
                    className={`card-flat rounded-2xl p-4 text-left hover:border-primary-300 transition-all ${
                      selectedSub?.id === sub.id ? "border-primary-400 bg-primary-50/50" : ""
                    }`}
                    id={`submission-${sub.id}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 font-bold text-xs shrink-0">
                          {sub.student?.full_name?.charAt(0) || "M"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900 leading-none">
                            {sub.student?.full_name || "Mahasiswa"}
                          </p>
                          <p className="text-xs text-neutral-400 mt-0.5">{sub.lkpd?.title}</p>
                        </div>
                      </div>
                      <span className={`badge text-xs ${info?.class} shrink-0`}>
                        <InfoIcon className="w-3 h-3" />
                        {info?.label}
                      </span>
                    </div>
                    {sub.ai_score !== null && sub.ai_score !== undefined && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Sparkles className="w-3 h-3 text-ai-500" />
                        <span className="text-xs text-ai-600 font-semibold">
                          Skor AI: {sub.ai_score}/{sub.lkpd?.max_score}
                        </span>
                      </div>
                    )}
                    {sub.final_score !== null && sub.final_score !== undefined && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Star className="w-3 h-3 text-amber-500" />
                        <span className="text-xs text-amber-600 font-semibold">
                          Nilai Final: {sub.final_score}/{sub.lkpd?.max_score}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-neutral-300 mt-2">
                      {new Date(sub.submitted_at).toLocaleString("id-ID", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-16 text-neutral-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-200" />
                <p className="font-medium">Tidak ada tugas</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selectedSub && (
          <div className="flex-1 animate-slide-in-right">
            <div className="card-flat rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-neutral-100">
                <div>
                  <h3 className="font-extrabold text-neutral-900">{selectedSub.lkpd?.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-neutral-500">
                      <User className="w-3 h-3" />
                      {selectedSub.student?.full_name || "Mahasiswa"}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-neutral-400">
                      <FileText className="w-3 h-3" />
                      {selectedSub.answers?.length} jawaban
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* AI Grade button */}
                  {selectedSub.status !== "validated" && (
                    <button
                      onClick={() => runAIGrading(selectedSub)}
                      disabled={grading}
                      className="btn-ai text-xs py-2 px-3.5"
                      id="run-ai-grading"
                    >
                      {grading ? (
                        <><div className="spinner !border-white/30 !border-t-white" /> Menganalisis...</>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          {selectedSub.status === "ai_graded" ? "Koreksi Ulang AI" : "Koreksi dengan AI"}
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedSub(null)}
                    className="btn-ghost p-2"
                    id="close-detail"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Split screen body */}
              <div className="p-5">
                <div className="split-screen">
                  {/* LEFT: Student answers */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-neutral-800 flex items-center gap-2">
                      <User className="w-4 h-4 text-primary-600" />
                      Jawaban Mahasiswa
                    </h4>
                    {selectedSub.lkpd?.questions?.map((q, i) => {
                      const answer = selectedSub.answers?.find(
                        (a) => a.question_id === q.id
                      );
                      const isExpanded = expandedAnswers[q.id];
                      return (
                        <div key={q.id} className="card-flat rounded-xl p-4 border border-neutral-200">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                              Soal {i + 1} · Maks {q.max_points} poin
                            </p>
                            <button
                              onClick={() =>
                                setExpandedAnswers((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                              }
                              className="text-neutral-400 hover:text-neutral-600"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                          {isExpanded && (
                            <p className="text-xs text-neutral-500 mb-2 font-mono bg-neutral-50 rounded-lg p-2">
                              {q.question_text}
                            </p>
                          )}
                          <div className="bg-white border border-neutral-200 rounded-lg p-3">
                            <p className="text-sm text-neutral-800 whitespace-pre-wrap">
                              {answer?.answer_text || (
                                <span className="text-neutral-300 italic">Tidak dijawab</span>
                              )}
                            </p>
                          </div>
                          {answer?.ai_score !== undefined && (
                            <p className="text-xs text-ai-600 font-semibold mt-1.5 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Skor AI: {answer.ai_score}/{q.max_points}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* RIGHT: AI Feedback */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-neutral-800 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-ai-600" />
                      Hasil Analisis Groq AI
                    </h4>

                    {!aiFeedback ? (
                      <div className="flex flex-col items-center justify-center p-8 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200 text-center">
                        {grading ? (
                          <>
                            <div className="spinner !w-8 !h-8 !border-2 !border-ai-200 !border-t-ai-600 mb-3" />
                            <p className="text-sm text-ai-600 font-semibold">Groq AI sedang menganalisis...</p>
                            <p className="text-xs text-neutral-400 mt-1">Estimasi waktu 2-3 detik</p>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-2xl bg-ai-50 flex items-center justify-center text-ai-600 mb-3">
                              <Sparkles className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-neutral-800">Mulai Analisis Groq AI</p>
                            <p className="text-xs text-neutral-400 max-w-xs mt-1 mb-4">
                              AI akan mengoreksi semua jawaban mahasiswa secara otomatis berdasarkan rubrik & konsep matematika.
                            </p>
                            <button
                              type="button"
                              onClick={() => runAIGrading(selectedSub)}
                              disabled={grading}
                              className="btn-ai text-xs py-2 px-4 shadow-sm"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Koreksi dengan Groq AI
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* AI Score overview */}
                        <div className="ai-box">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-xs text-neutral-500 mb-1">Skor AI</p>
                              <p className="text-3xl font-extrabold text-ai-700">
                                {aiFeedback.total_score}
                                <span className="text-lg text-ai-400">/{aiFeedback.max_score}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-neutral-500 mb-1">Persentase</p>
                              <p className="text-2xl font-bold text-ai-600">
                                {aiFeedback.percentage}%
                              </p>
                            </div>
                          </div>
                          <div className="progress-bar mb-3">
                            <div
                              className="progress-bar-fill bg-gradient-to-r from-ai-500 to-ai-400"
                              style={{ width: `${aiFeedback.percentage}%` }}
                            />
                          </div>
                          <p className="text-sm text-neutral-700">{aiFeedback.overall_feedback}</p>
                        </div>

                        {/* Per-question feedback */}
                        {aiFeedback.question_feedbacks?.map((qf, i) => (
                          <div key={qf.question_id} className="card-flat rounded-xl p-4 border-l-4 border-ai-400">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                Soal {i + 1}
                              </p>
                              <span className="text-sm font-bold text-ai-600">
                                {qf.score}/{qf.max_points}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-700">{qf.feedback}</p>
                          </div>
                        ))}

                        {/* Strengths & Improvements */}
                        <div className="grid grid-cols-2 gap-3">
                          {aiFeedback.strengths?.length > 0 && (
                            <div className="bg-emerald-50 rounded-xl p-3">
                              <p className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Kelebihan
                              </p>
                              <ul className="space-y-1">
                                {aiFeedback.strengths.map((s, i) => (
                                  <li key={i} className="text-xs text-emerald-700">• {s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {aiFeedback.improvements?.length > 0 && (
                            <div className="bg-amber-50 rounded-xl p-3">
                              <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Perlu Diperbaiki
                              </p>
                              <ul className="space-y-1">
                                {aiFeedback.improvements.map((s, i) => (
                                  <li key={i} className="text-xs text-amber-700">• {s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Validation area */}
                        {selectedSub.status !== "validated" && (
                          <div className="card-flat rounded-2xl p-4 border-2 border-primary-200 bg-primary-50/30">
                            <h5 className="font-bold text-neutral-900 mb-3 flex items-center gap-2">
                              <Eye className="w-4 h-4 text-primary-600" />
                              Validasi Nilai Akhir
                            </h5>
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-semibold text-neutral-600 block mb-1.5">
                                  Nilai Final (0 - {selectedSub.lkpd?.max_score})
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  max={selectedSub.lkpd?.max_score}
                                  value={finalScore}
                                  onChange={(e) => setFinalScore(Number(e.target.value))}
                                  className="input-field"
                                  id="final-score-input"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-neutral-600 block mb-1.5">
                                  Catatan untuk Mahasiswa (opsional)
                                </label>
                                <textarea
                                  value={teacherNotes}
                                  onChange={(e) => setTeacherNotes(e.target.value)}
                                  className="input-field resize-none"
                                  rows={3}
                                  placeholder="Catatan tambahan dari dosen..."
                                  id="teacher-notes"
                                />
                              </div>
                              <button
                                onClick={validateScore}
                                disabled={validating}
                                className="btn-primary w-full justify-center"
                                id="validate-score-btn"
                              >
                                {validating ? (
                                  <><div className="spinner !border-white/30 !border-t-white" /> Menyimpan...</>
                                ) : (
                                  <><Save className="w-4 h-4" /> Simpan Nilai Final</>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {selectedSub.status === "validated" && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                            <p className="font-bold text-emerald-700">Nilai Telah Divalidasi</p>
                            <p className="text-sm text-emerald-600">
                              Nilai Final: <strong>{selectedSub.final_score}/{selectedSub.lkpd?.max_score}</strong>
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GradingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <div className="spinner !w-8 !h-8 !border-2 !border-primary-200 !border-t-primary-600" />
        </div>
      }
    >
      <GradingContent />
    </Suspense>
  );
}
