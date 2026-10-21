/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import TopNav from "@/components/layout/TopNav";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Award,
  Clock,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Star,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = { title: "Dashboard Siswa" };

export default async function SiswaDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const [
    { count: enrolledClasses },
    { count: completedLKPD },
    { count: pendingLKPD },
  ] = await Promise.all([
    supabase
      .from("kelas_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .eq("role", "siswa"),
    supabase
      .from("lkpd_submissions")
      .select("*", { count: "exact", head: true })
      .eq("student_id", user!.id)
      .in("status", ["ai_graded", "validated"]),
    supabase
      .from("lkpd_submissions")
      .select("*", { count: "exact", head: true })
      .eq("student_id", user!.id)
      .eq("status", "submitted"),
  ]);

  const { data: recentSubs } = await supabase
    .from("lkpd_submissions")
    .select(
      `id, submitted_at, status, ai_score, final_score,
       lkpd:lkpd!lkpd_submissions_lkpd_id_fkey(title, max_score)`
    )
    .eq("student_id", user!.id)
    .order("submitted_at", { ascending: false })
    .limit(5);

  const { data: classes } = await supabase
    .from("kelas_members")
    .select(
      `kelas:kelas!kelas_members_kelas_id_fkey(id, name, subject, semester)`
    )
    .eq("user_id", user!.id)
    .eq("role", "siswa")
    .limit(4);

  const { data: scores } = await supabase
    .from("lkpd_submissions")
    .select("final_score")
    .eq("student_id", user!.id)
    .eq("status", "validated")
    .not("final_score", "is", null);

  const avgScore =
    scores && scores.length > 0
      ? Math.round(
          scores.reduce((acc, s) => acc + (s.final_score || 0), 0) / scores.length
        )
      : 0;

  const statusInfo: Record<string, { label: string; class: string }> = {
    submitted: { label: "Menunggu Koreksi", class: "badge-warning" },
    ai_grading: { label: "Dikoreksi AI...", class: "badge-ai" },
    ai_graded: { label: "Selesai AI", class: "badge-ai" },
    validated: { label: "Nilai Final", class: "badge-success" },
  };

  return (
    <div>
      <TopNav
        title="Dashboard Mahasiswa"
        breadcrumbs={[{ label: "Siswa" }, { label: "Dashboard" }]}
      />
      <div className="p-6 space-y-6">
        {/* Welcome banner */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-teal-500 to-ai-600 text-white">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-indigo-300/20 rounded-full translate-y-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-5 h-5 text-white/80" />
              <span className="text-sm font-medium text-white/80">Portal Mahasiswa</span>
            </div>
            <h2 className="text-2xl font-extrabold mb-1">
              Halo, {profile?.full_name?.split(" ")[0] || "Mahasiswa"}! 🎓
            </h2>
            <p className="text-white/70 text-sm max-w-md">
              Kamu terdaftar di{" "}
              <strong className="text-white">{enrolledClasses ?? 0} kelas</strong>. Rata-rata
              nilaimu:{" "}
              <strong className="text-yellow-200">
                {avgScore > 0 ? `${avgScore} poin` : "Belum ada nilai"}
              </strong>
            </p>
            <Link
              href="/dashboard/siswa/classes"
              className="inline-flex items-center gap-2 mt-4 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Lihat Kelas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Kelas Diikuti", value: enrolledClasses ?? 0, icon: BookOpen, color: "text-primary-600", bg: "bg-primary-50" },
            { label: "LKPD Selesai", value: completedLKPD ?? 0, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "LKPD Menunggu", value: pendingLKPD ?? 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Rata-rata Nilai", value: avgScore, icon: Star, color: "text-violet-600", bg: "bg-violet-50" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-3xl font-extrabold text-neutral-900">{s.value}</p>
              <p className="text-sm font-semibold text-neutral-600">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Content grid */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Recent submissions */}
          <div className="lg:col-span-3 card-flat rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <div>
                <h3 className="font-bold text-neutral-900">Riwayat LKPD</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Tugas yang sudah dikumpulkan</p>
              </div>
              <Link href="/dashboard/siswa/lkpd" className="btn-secondary text-xs py-2 px-3">
                <ClipboardCheck className="w-3.5 h-3.5" />
                Semua LKPD
              </Link>
            </div>
            <div className="divide-y divide-neutral-100">
              {recentSubs && recentSubs.length > 0 ? (
                (recentSubs as any[]).map((sub) => {
                  const info = statusInfo[sub.status] || {
                    label: sub.status,
                    class: "badge-neutral",
                  };
                  const lkpd = Array.isArray(sub.lkpd) ? sub.lkpd[0] : sub.lkpd;
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                          <ClipboardCheck className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">
                            {lkpd?.title || "LKPD"}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {new Date(sub.submitted_at).toLocaleString("id-ID", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`badge text-xs ${info.class}`}>{info.label}</span>
                        {sub.final_score != null ? (
                          <p className="text-xs text-amber-600 font-bold mt-1 flex items-center gap-1 justify-end">
                            <Star className="w-3 h-3" />
                            {sub.final_score}/{lkpd?.max_score}
                          </p>
                        ) : sub.ai_score != null ? (
                          <p className="text-xs text-ai-600 font-semibold mt-1 flex items-center gap-1 justify-end">
                            <Sparkles className="w-3 h-3" />
                            {sub.ai_score}/{lkpd?.max_score}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-neutral-400">
                  <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Belum ada LKPD yang dikumpulkan</p>
                  <p className="text-sm mt-1">Mulai kerjakan LKPD dari kelas kamu.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Classes */}
            <div className="card-flat rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-neutral-900">Kelas Saya</h3>
                <Link
                  href="/dashboard/siswa/classes"
                  className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                >
                  Lihat Semua →
                </Link>
              </div>
              <div className="space-y-2">
                {classes && classes.length > 0 ? (
                  (classes as any[]).map((c, index) => {
                    const kelas = Array.isArray(c.kelas) ? c.kelas[0] : c.kelas;
                    if (!kelas?.id) return null;
                    return (
                      <Link
                        key={c.kelas_id ?? kelas.id ?? `class-${index}`}
                        href={`/dashboard/siswa/classes/${kelas.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-ai-50 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-4 h-4 text-ai-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-neutral-900 truncate">
                            {kelas?.name}
                          </p>
                          <p className="text-xs text-neutral-400">{kelas?.subject}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-400 transition-colors shrink-0" />
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-sm text-neutral-400 text-center py-4">
                    Belum terdaftar di kelas manapun
                  </p>
                )}
              </div>
            </div>

            {/* Progress visual */}
            <div className="card-flat rounded-2xl p-5">
              <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-600" />
                Progres Belajar
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
                    <span>LKPD Selesai</span>
                    <span className="font-semibold">
                      {completedLKPD ?? 0}/
                      {(completedLKPD ?? 0) + (pendingLKPD ?? 0)}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${
                          (completedLKPD ?? 0) + (pendingLKPD ?? 0) > 0
                            ? Math.round(
                                ((completedLKPD ?? 0) /
                                  ((completedLKPD ?? 0) + (pendingLKPD ?? 0))) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
                    <span>Rata-rata Nilai</span>
                    <span className="font-semibold">{avgScore}/100</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${avgScore}%` }}
                    />
                  </div>
                </div>
              </div>

              <Link
                href="/dashboard/siswa/grades"
                className="inline-flex items-center gap-2 mt-4 text-xs text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                <Award className="w-3.5 h-3.5" />
                Lihat Detail Nilai & Feedback AI
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
