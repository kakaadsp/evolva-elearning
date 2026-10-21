/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import TopNav from "@/components/layout/TopNav";
import Link from "next/link";
import {
  BookOpen,
  ClipboardCheck,
  Award,
  BarChart3,
  Plus,
  Brain,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = { title: "Dashboard Guru" };

export default async function GuruDashboard() {
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
    { count: myClasses },
    { count: pendingSubmissions },
    { count: materialsPublished },
    { count: lkpdCreated },
  ] = await Promise.all([
    supabase
      .from("kelas_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .eq("role", "guru"),
    supabase
      .from("lkpd_submissions")
      .select("*", { count: "exact", head: true })
      .eq("status", "submitted"),
    supabase
      .from("materi")
      .select("*", { count: "exact", head: true })
      .eq("created_by", user!.id)
      .eq("is_available", true),
    supabase
      .from("lkpd")
      .select("*", { count: "exact", head: true })
      .eq("created_by", user!.id),
  ]);

  const { data: pendingSubs } = await supabase
    .from("lkpd_submissions")
    .select(
      `id, submitted_at, status,
       student:profiles!lkpd_submissions_student_id_fkey(full_name),
       lkpd:lkpd!lkpd_submissions_lkpd_id_fkey(title)`
    )
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(5);

  const { data: classes } = await supabase
    .from("kelas_members")
    .select(
      `kelas:kelas!kelas_members_kelas_id_fkey(id, name, subject, semester)`
    )
    .eq("user_id", user!.id)
    .eq("role", "guru")
    .limit(4);

  return (
    <div>
      <TopNav
        title="Dashboard Guru"
        breadcrumbs={[{ label: "Guru" }, { label: "Dashboard" }]}
      />
      <div className="p-6 space-y-6">
        {/* Welcome banner */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-indigo-600 to-primary-600 text-white">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-teal-300/20 rounded-full translate-y-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-white/80" />
              <span className="text-sm font-medium text-white/80">Mode Guru / Dosen</span>
            </div>
            <h2 className="text-2xl font-extrabold mb-1">
              Halo, {profile?.full_name?.split(" ")[0] || "Guru"}! 👋
            </h2>
            <p className="text-white/70 text-sm max-w-md">
              Kamu memiliki{" "}
              <strong className="text-white">{pendingSubmissions ?? 0} tugas</strong>{" "}
              yang menunggu dikoreksi. Groq AI siap membantu!
            </p>
            {(pendingSubmissions ?? 0) > 0 && (
              <Link
                href="/dashboard/guru/grading"
                className="inline-flex items-center gap-2 mt-4 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Koreksi Sekarang <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Kelas Aktif", value: myClasses ?? 0, icon: BookOpen, color: "text-primary-600", bg: "bg-primary-50", href: "/dashboard/guru/classes" },
            { label: "Tugas Menunggu", value: pendingSubmissions ?? 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", href: "/dashboard/guru/grading" },
            { label: "Materi Aktif", value: materialsPublished ?? 0, icon: ClipboardCheck, color: "text-emerald-600", bg: "bg-emerald-50", href: "/dashboard/guru/materials" },
            { label: "Total LKPD", value: lkpdCreated ?? 0, icon: Award, color: "text-violet-600", bg: "bg-violet-50", href: "/dashboard/guru/lkpd" },
          ].map((s) => (
            <Link key={s.label} href={s.href} className="stat-card hover:no-underline group">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-neutral-300 group-hover:text-primary-400 transition-colors" />
              </div>
              <p className="text-3xl font-extrabold text-neutral-900">{s.value}</p>
              <p className="text-sm font-semibold text-neutral-600">{s.label}</p>
            </Link>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Pending submissions */}
          <div className="lg:col-span-3 card-flat rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <div>
                <h3 className="font-bold text-neutral-900">Tugas Menunggu Koreksi</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Klik Koreksi AI untuk menilai otomatis</p>
              </div>
              <Link href="/dashboard/guru/grading" className="btn-ai text-xs py-2 px-3">
                <Brain className="w-3.5 h-3.5" />
                Koreksi AI
              </Link>
            </div>
            <div className="divide-y divide-neutral-100">
              {pendingSubs && pendingSubs.length > 0 ? (
                (pendingSubs as any[]).map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                        <ClipboardCheck className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">
                          {Array.isArray(sub.student)
                            ? sub.student[0]?.full_name
                            : sub.student?.full_name}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {Array.isArray(sub.lkpd)
                            ? sub.lkpd[0]?.title
                            : sub.lkpd?.title}{" "}
                          ·{" "}
                          {new Date(sub.submitted_at).toLocaleString("id-ID", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="badge badge-warning text-xs">Menunggu</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-neutral-400">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-300" />
                  <p className="font-medium text-emerald-600">Semua sudah dikoreksi!</p>
                  <p className="text-sm mt-1">Tidak ada tugas yang menunggu.</p>
                </div>
              )}
            </div>
          </div>

          {/* My classes + quick actions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card-flat rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-neutral-900">Kelas Saya</h3>
                <Link
                  href="/dashboard/guru/classes"
                  className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                >
                  Lihat Semua →
                </Link>
              </div>
              <div className="space-y-2">
                {classes && classes.length > 0 ? (
                  (classes as any[]).map((c) => {
                    const kelas = Array.isArray(c.kelas) ? c.kelas[0] : c.kelas;
                    return (
                      <Link
                        key={kelas?.id}
                        href={`/dashboard/guru/classes/${kelas?.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-primary-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 truncate">
                            {kelas?.name}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {kelas?.subject} · Sem. {kelas?.semester}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-sm text-neutral-400 text-center py-4">Belum ada kelas</p>
                )}
              </div>
            </div>

            <div className="card-flat rounded-2xl p-5">
              <h3 className="font-bold text-neutral-900 mb-4">Buat Konten</h3>
              <div className="space-y-2">
                {[
                  { label: "Tambah Materi Baru", href: "/dashboard/guru/materials/new", icon: BookOpen, color: "text-primary-600 bg-primary-50" },
                  { label: "Buat LKPD Baru", href: "/dashboard/guru/lkpd/new", icon: ClipboardCheck, color: "text-ai-600 bg-ai-50" },
                  { label: "Buat Pengumuman", href: "/dashboard/guru/announcements/new", icon: BarChart3, color: "text-violet-600 bg-violet-50" },
                ].map((a) => (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-lg ${a.color} flex items-center justify-center`}>
                      <a.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-neutral-700 group-hover:text-primary-600 transition-colors flex items-center gap-1">
                      <Plus className="w-3 h-3" /> {a.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
