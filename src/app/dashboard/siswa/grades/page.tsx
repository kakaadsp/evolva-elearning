import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import TopNav from "@/components/layout/TopNav";
import Link from "next/link";
import {
  Star,
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
  BookOpen,
  TrendingUp,
} from "lucide-react";

export const metadata: Metadata = { title: "Nilai & Feedback AI" };

export default async function SiswaGradesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: submissions } = await supabase
    .from("lkpd_submissions")
    .select(`
      *,
      lkpd:lkpd!lkpd_submissions_lkpd_id_fkey(title, max_score, modul_id,
        modul:modul_pembelajaran!lkpd_modul_id_fkey(title,
          kelas:kelas!modul_pembelajaran_kelas_id_fkey(name)
        )
      )
    `)
    .eq("student_id", user!.id)
    .order("submitted_at", { ascending: false });

  const statusInfo: Record<string, { label: string; icon: React.ElementType; class: string }> = {
    submitted: { label: "Menunggu Koreksi", icon: Clock, class: "badge-warning" },
    ai_grading: { label: "AI Sedang Mengoreksi", icon: Sparkles, class: "badge-ai" },
    ai_graded: { label: "Dikoreksi AI", icon: Sparkles, class: "badge-ai" },
    validated: { label: "Nilai Final", icon: CheckCircle, class: "badge-success" },
  };

  return (
    <div>
      <TopNav
        title="Nilai & Feedback AI"
        breadcrumbs={[
          { label: "Siswa", href: "/dashboard/siswa" },
          { label: "Nilai" },
        ]}
      />
      <div className="p-6 space-y-4">
        {submissions && submissions.length > 0 ? (
          submissions.map((sub: {
            id: string;
            status: string;
            submitted_at: string;
            ai_score?: number | null;
            final_score?: number | null;
            teacher_notes?: string | null;
            ai_feedback?: {
              overall_feedback?: string;
              percentage?: number;
              strengths?: string[];
              improvements?: string[];
            } | null;
            lkpd?: {
              title?: string;
              max_score?: number;
              modul?: {
                title?: string;
                kelas?: { name?: string } | null;
              } | null;
            } | null;
          }) => {
            const info = statusInfo[sub.status] || statusInfo.submitted;
            const InfoIcon = info.icon;
            const aiFeedback = sub.ai_feedback;

            return (
              <div key={sub.id} className="card-flat rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between p-5 border-b border-neutral-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900">{sub.lkpd?.title}</h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {sub.lkpd?.modul?.kelas?.name} · {sub.lkpd?.modul?.title}
                      </p>
                      <p className="text-xs text-neutral-300 mt-0.5">
                        Dikumpulkan: {new Date(sub.submitted_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>
                  <span className={`badge ${info.class} text-xs`}>
                    <InfoIcon className="w-3 h-3" />
                    {info.label}
                  </span>
                </div>

                {/* Scores */}
                <div className="p-5">
                  <div className="flex gap-4 mb-4">
                    {/* AI Score */}
                    {sub.ai_score !== null && sub.ai_score !== undefined && (
                      <div className="flex-1 bg-ai-50 rounded-xl p-3 border border-ai-100">
                        <div className="flex items-center gap-1 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-ai-600" />
                          <span className="text-xs font-semibold text-ai-700">Skor AI (Groq)</span>
                        </div>
                        <p className="text-2xl font-extrabold text-ai-600">
                          {sub.ai_score}
                          <span className="text-sm text-ai-400">/{sub.lkpd?.max_score}</span>
                        </p>
                        {sub.lkpd?.max_score && (
                          <div className="progress-bar mt-2">
                            <div
                              className="h-full bg-gradient-to-r from-ai-400 to-ai-500 rounded-full transition-all duration-700"
                              style={{ width: `${Math.round((sub.ai_score / sub.lkpd.max_score) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Final score */}
                    {sub.final_score !== null && sub.final_score !== undefined && (
                      <div className="flex-1 bg-amber-50 rounded-xl p-3 border border-amber-100">
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-xs font-semibold text-amber-700">Nilai Final (Dosen)</span>
                        </div>
                        <p className="text-2xl font-extrabold text-amber-600">
                          {sub.final_score}
                          <span className="text-sm text-amber-400">/{sub.lkpd?.max_score}</span>
                        </p>
                        {sub.lkpd?.max_score && (
                          <div className="progress-bar mt-2">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
                              style={{ width: `${Math.round((sub.final_score / sub.lkpd.max_score) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {sub.ai_score === null && sub.final_score === null && (
                      <div className="flex-1 bg-neutral-50 rounded-xl p-4 flex items-center gap-3">
                        <Clock className="w-5 h-5 text-neutral-300" />
                        <p className="text-sm text-neutral-400">Menunggu koreksi AI...</p>
                      </div>
                    )}
                  </div>

                  {/* AI Feedback */}
                  {aiFeedback && (
                    <div className="space-y-3">
                      <div className="ai-box">
                        <p className="text-sm text-neutral-700">{aiFeedback.overall_feedback}</p>
                      </div>

                      {/* Strengths & improvements */}
                      <div className="grid grid-cols-2 gap-3">
                        {aiFeedback.strengths && aiFeedback.strengths.length > 0 && (
                          <div className="bg-emerald-50 rounded-xl p-3">
                            <p className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Kelebihanmu
                            </p>
                            <ul className="space-y-1">
                              {aiFeedback.strengths.map((s: string, i: number) => (
                                <li key={i} className="text-xs text-emerald-700">✓ {s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {aiFeedback.improvements && aiFeedback.improvements.length > 0 && (
                          <div className="bg-amber-50 rounded-xl p-3">
                            <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Perlu Ditingkatkan
                            </p>
                            <ul className="space-y-1">
                              {aiFeedback.improvements.map((s: string, i: number) => (
                                <li key={i} className="text-xs text-amber-700">→ {s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Teacher notes */}
                  {sub.teacher_notes && (
                    <div className="mt-3 bg-blue-50 rounded-xl p-3 border border-blue-100">
                      <p className="text-xs font-bold text-blue-700 mb-1">📝 Catatan Dosen</p>
                      <p className="text-sm text-blue-700">{sub.teacher_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 text-neutral-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-neutral-600">Belum ada nilai</p>
            <p className="text-sm mt-1">Kumpulkan LKPD dari kelasmu untuk mendapatkan feedback AI.</p>
            <Link href="/dashboard/siswa/classes" className="btn-primary inline-flex mt-4">
              Ke Kelas Saya
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
