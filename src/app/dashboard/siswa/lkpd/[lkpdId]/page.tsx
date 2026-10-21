"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import TopNav from "@/components/layout/TopNav";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Clock,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import type { LKPD, LKPDAnswer } from "@/types";

export default function StudentLKPDPage() {
  const params = useParams();
  const router = useRouter();
  const lkpdId = params.lkpdId as string;

  const [lkpd, setLkpd] = useState<LKPD | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<{
    status: string;
    ai_score?: number;
    final_score?: number;
  } | null>(null);

  const supabase = createClient();

  const fetchLKPD = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch LKPD
    const { data: lkpdData } = await supabase
      .from("lkpd")
      .select("*")
      .eq("id", lkpdId)
      .single();

    if (lkpdData) setLkpd(lkpdData as LKPD);

    // Check existing submission
    const { data: sub } = await supabase
      .from("lkpd_submissions")
      .select("status, ai_score, final_score")
      .eq("lkpd_id", lkpdId)
      .eq("student_id", user!.id)
      .maybeSingle();

    if (sub) {
      setExistingSubmission(sub);
      setSubmitted(true);
    }

    setLoading(false);
  }, [lkpdId, supabase]);

  useEffect(() => {
    fetchLKPD();
  }, [fetchLKPD]);

  async function handleSubmit() {
    if (!lkpd) return;

    // Check all questions answered
    const unanswered = lkpd.questions.filter((q) => !answers[q.id]?.trim());
    if (unanswered.length > 0) {
      toast.error(`${unanswered.length} soal belum dijawab. Jawab semua soal sebelum mengumpulkan.`);
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const answerList: LKPDAnswer[] = lkpd.questions.map((q) => ({
        question_id: q.id,
        answer_text: answers[q.id] || "",
      }));

      const { data: sub, error } = await supabase
        .from("lkpd_submissions")
        .insert({
          lkpd_id: lkpd.id,
          student_id: user!.id,
          answers: answerList,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Tugas berhasil dikumpulkan! 🎉 Groq AI akan segera mengoreksi.");
      setSubmitted(true);
      setExistingSubmission({ status: "submitted" });

      // Trigger AI grading in background
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .single();

      fetch("/api/ai/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: sub.id,
          lkpd_title: lkpd.title,
          questions: lkpd.questions,
          answers: answerList,
          student_name: profile?.full_name || user!.email,
        }),
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengumpulkan tugas");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <TopNav title="Memuat LKPD..." />
        <div className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!lkpd) {
    return (
      <div>
        <TopNav title="LKPD Tidak Ditemukan" />
        <div className="p-6 text-center py-20">
          <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
          <p className="font-bold text-neutral-700">LKPD tidak ditemukan atau belum tersedia.</p>
          <button onClick={() => router.back()} className="btn-primary mt-4">Kembali</button>
        </div>
      </div>
    );
  }

  const questions = lkpd.questions || [];
  const currentQuestion = questions[currentQ];
  const totalAnswered = questions.filter((q) => answers[q.id]?.trim()).length;
  const progress = questions.length > 0 ? Math.round((totalAnswered / questions.length) * 100) : 0;

  return (
    <div>
      <TopNav
        title={lkpd.title}
        breadcrumbs={[
          { label: "Siswa", href: "/dashboard/siswa" },
          { label: "LKPD", href: "/dashboard/siswa/lkpd" },
          { label: lkpd.title },
        ]}
      />

      <div className="p-6">
        {submitted ? (
          /* Submitted state */
          <div className="max-w-lg mx-auto text-center py-20">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-neutral-900 mb-3">
              Tugas Berhasil Dikumpulkan!
            </h2>
            <p className="text-neutral-500 mb-6">
              Groq AI sedang mengoreksi jawaban kamu. Hasil akan segera tersedia di halaman Nilai.
            </p>

            {existingSubmission?.ai_score !== undefined && (
              <div className="ai-box mb-6">
                <div className="flex items-center gap-2 justify-center mb-2">
                  <Sparkles className="w-5 h-5 text-ai-600" />
                  <p className="font-bold text-ai-700">Hasil Koreksi AI</p>
                </div>
                <p className="text-3xl font-extrabold text-ai-600">
                  {existingSubmission.ai_score}
                  <span className="text-lg text-ai-400">/{lkpd.max_score}</span>
                </p>
                {existingSubmission.final_score !== undefined && (
                  <p className="text-sm text-neutral-600 mt-2">
                    Nilai Final: <strong>{existingSubmission.final_score}</strong> (setelah validasi dosen)
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button onClick={() => router.back()} className="btn-secondary">
                Kembali
              </button>
              <a href="/dashboard/siswa/grades" className="btn-primary">
                Lihat Nilai Saya
              </a>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Progress bar */}
            <div className="card-flat rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-bold text-neutral-900">{lkpd.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {lkpd.deadline && (
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <Clock className="w-3.5 h-3.5" />
                      Deadline: {new Date(lkpd.deadline).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                    </div>
                  )}
                  <span className="text-sm font-bold text-primary-600">
                    {totalAnswered}/{questions.length} dijawab
                  </span>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>

              {/* Question nav dots */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQ(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      i === currentQ
                        ? "bg-primary-600 text-white"
                        : answers[q.id]?.trim()
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                    }`}
                    id={`nav-q-${i}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Instructions (collapsed) */}
            <details className="card-flat rounded-2xl overflow-hidden">
              <summary className="flex items-center gap-2 p-4 cursor-pointer hover:bg-neutral-50 transition-colors">
                <BookOpen className="w-4 h-4 text-primary-600" />
                <span className="font-semibold text-neutral-800 text-sm">Petunjuk Pengerjaan (klik untuk buka)</span>
              </summary>
              <div className="px-5 pb-5 prose-evolva border-t border-neutral-100 pt-4">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex, rehypeRaw]}
                >
                  {lkpd.instructions}
                </ReactMarkdown>
              </div>
            </details>

            {/* Current question */}
            {currentQuestion && (
              <div className="card-flat rounded-2xl overflow-hidden animate-fade-in" key={currentQ}>
                {/* Question header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-neutral-50/50">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-primary text-xs">Soal {currentQ + 1}</span>
                    <span className="badge badge-neutral text-xs">{currentQuestion.max_points} poin</span>
                    <span className="badge badge-neutral text-xs capitalize">{currentQuestion.question_type.replace("_", " ")}</span>
                  </div>
                  <span className="text-xs text-neutral-400">{currentQ + 1} dari {questions.length}</span>
                </div>

                {/* Question text */}
                <div className="p-5 border-b border-neutral-100">
                  <div className="prose-evolva">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex, rehypeRaw]}
                    >
                      {currentQuestion.question_text}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Answer area */}
                <div className="p-5">
                  <label className="text-xs font-semibold text-neutral-500 mb-2 block">
                    Jawaban Kamu
                  </label>
                  <textarea
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))
                    }
                    className="input-field resize-none"
                    rows={currentQuestion.question_type === "essay" ? 8 : 4}
                    placeholder={
                      currentQuestion.question_type === "calculation"
                        ? "Tuliskan langkah penyelesaian dan hasil akhirnya..."
                        : currentQuestion.question_type === "essay"
                        ? "Jawab dengan lengkap dan sistematis..."
                        : "Tulis jawabanmu di sini..."
                    }
                    id={`answer-${currentQuestion.id}`}
                  />
                  {currentQuestion.question_type === "calculation" && (
                    <p className="text-xs text-neutral-400 mt-1.5">
                      💡 Kamu bisa menggunakan notasi matematika biasa. Contoh: x^2, sqrt(x), pi
                    </p>
                  )}
                  {answers[currentQuestion.id]?.trim() && (
                    <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Soal ini sudah dijawab
                    </p>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center p-4 border-t border-neutral-100 bg-neutral-50/50">
                  <button
                    onClick={() => setCurrentQ((prev) => Math.max(0, prev - 1))}
                    disabled={currentQ === 0}
                    className="btn-secondary py-2 px-4 disabled:opacity-40"
                    id="prev-question"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Sebelumnya
                  </button>

                  {currentQ < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQ((prev) => Math.min(questions.length - 1, prev + 1))}
                      className="btn-primary py-2 px-4"
                      id="next-question"
                    >
                      Selanjutnya
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="btn-primary py-2 px-6 bg-emerald-600 hover:bg-emerald-700"
                      id="submit-lkpd-btn"
                    >
                      {submitting ? (
                        <><div className="spinner !border-white/30 !border-t-white" /> Mengumpulkan...</>
                      ) : (
                        <><Send className="w-4 h-4" /> Kumpulkan Tugas</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
