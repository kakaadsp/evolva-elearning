import type { Metadata } from "next";
import { BookOpen, ClipboardCheck, Users, Award } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import TopNav from "@/components/layout/TopNav";
import GuruAnalyticsCharts from "@/components/analytics/GuruAnalyticsCharts";
import type { SubmissionAnalyticsItem } from "@/components/analytics/GuruAnalyticsCharts";

export const metadata: Metadata = { title: "Analitik Pembelajaran | Evolva E-Learning" };

export default async function GuruAnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminSupabase = await createAdminClient();

  // Fetch count of classes, students, and all LKPD submissions
  const [{ count: classes }, { count: students }, { data: rawSubmissions }] =
    await Promise.all([
      adminSupabase
        .from("kelas_members")
        .select("*", { count: "exact", head: true })
        .eq("role", "guru")
        .eq(user ? "user_id" : "role", user ? user.id : "guru"),
      adminSupabase
        .from("kelas_members")
        .select("*", { count: "exact", head: true })
        .eq("role", "siswa"),
      adminSupabase
        .from("lkpd_submissions")
        .select(`
          id,
          lkpd_id,
          status,
          ai_score,
          final_score,
          submitted_at,
          student:profiles!lkpd_submissions_student_id_fkey(full_name, email),
          lkpd:lkpd!lkpd_submissions_lkpd_id_fkey(title, max_score)
        `)
        .order("submitted_at", { ascending: false }),
    ]);

  // Transform raw submissions to strongly typed analytics items
  const submissions: SubmissionAnalyticsItem[] = (rawSubmissions || []).map((sub: any) => ({
    id: sub.id,
    lkpd_id: sub.lkpd_id,
    lkpd_title: sub.lkpd?.title || "LKPD Tanpa Judul",
    student_name: sub.student?.full_name || "Mahasiswa",
    student_email: sub.student?.email || "",
    status: sub.status || "submitted",
    ai_score: sub.ai_score,
    final_score: sub.final_score,
    max_score: sub.lkpd?.max_score || 100,
    submitted_at: sub.submitted_at,
  }));

  // Calculate average score percentage
  const scoredSubs = submissions.filter(
    (s) => (s.final_score !== null || s.ai_score !== null) && s.max_score > 0
  );
  const avgScore =
    scoredSubs.length > 0
      ? Math.round(
          scoredSubs.reduce((acc, s) => {
            const score = s.final_score !== null ? s.final_score : s.ai_score || 0;
            return acc + (score / s.max_score) * 100;
          }, 0) / scoredSubs.length
        )
      : 0;

  const cards: { label: string; value: number | string; Icon: LucideIcon; style: string }[] = [
    {
      label: "Kelas Aktif",
      value: classes ?? 0,
      Icon: BookOpen,
      style: "bg-primary-50 text-primary-600",
    },
    {
      label: "Siswa Terdaftar",
      value: students ?? 0,
      Icon: Users,
      style: "bg-ai-50 text-ai-600",
    },
    {
      label: "Total Pengumpulan",
      value: submissions.length,
      Icon: ClipboardCheck,
      style: "bg-amber-50 text-amber-600",
    },
    {
      label: "Rata-rata Nilai",
      value: scoredSubs.length > 0 ? `${avgScore}%` : "-",
      Icon: Award,
      style: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div>
      <TopNav
        title="Analitik Pembelajaran"
        breadcrumbs={[
          { label: "Guru", href: "/dashboard/guru" },
          { label: "Analitik" },
        ]}
      />

      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Ringkasan Progres & Analitik</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Pantau aktivitas kelas, tren nilai mahasiswa, dan hasil koreksi Groq AI secara real-time.
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(({ label, value, Icon, style }) => (
            <div key={label} className="stat-card">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-3xl font-extrabold text-neutral-900">{value}</p>
              <p className="text-sm font-semibold text-neutral-600">{label}</p>
            </div>
          ))}
        </div>

        {/* Recharts Analytics Charts & Progress Breakdown */}
        <GuruAnalyticsCharts submissions={submissions} averageScore={avgScore} />
      </div>
    </div>
  );
}
