"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Award,
  BookOpen,
} from "lucide-react";

export interface SubmissionAnalyticsItem {
  id: string;
  lkpd_id: string;
  lkpd_title: string;
  student_name: string;
  student_email?: string;
  status: "submitted" | "ai_grading" | "ai_graded" | "validated";
  ai_score: number | null;
  final_score: number | null;
  max_score: number;
  submitted_at: string;
}

interface GuruAnalyticsChartsProps {
  submissions: SubmissionAnalyticsItem[];
  averageScore: number;
}

const STATUS_COLORS: Record<string, string> = {
  validated: "#10b981", // Emerald
  ai_graded: "#0d9488", // Teal AI
  ai_grading: "#06b6d4", // Cyan
  submitted: "#f59e0b", // Amber
};

const STATUS_LABELS: Record<string, string> = {
  validated: "Tervalidasi",
  ai_graded: "Selesai AI",
  ai_grading: "Sedang Dikoreksi AI",
  submitted: "Menunggu Koreksi",
};

export default function GuruAnalyticsCharts({
  submissions,
  averageScore,
}: GuruAnalyticsChartsProps) {
  // Chart 1 Data: Comparison of AI Score vs Final Score per student/LKPD
  const barData = useMemo(() => {
    return submissions.map((sub, index) => {
      const displayName =
        submissions.length > 5
          ? `${sub.student_name.slice(0, 10)}...`
          : sub.student_name;
      return {
        name: displayName,
        fullName: sub.student_name,
        lkpdTitle: sub.lkpd_title,
        skorAI: sub.ai_score ?? 0,
        nilaiFinal: sub.final_score ?? sub.ai_score ?? 0,
        maxScore: sub.max_score || 100,
        percentage:
          sub.final_score !== null && sub.max_score > 0
            ? Math.round((sub.final_score / sub.max_score) * 100)
            : sub.ai_score !== null && sub.max_score > 0
            ? Math.round((sub.ai_score / sub.max_score) * 100)
            : 0,
        id: sub.id,
      };
    });
  }, [submissions]);

  // Chart 2 Data: Distribution of submission status
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {
      validated: 0,
      ai_graded: 0,
      submitted: 0,
    };

    submissions.forEach((s) => {
      if (s.status in counts) {
        counts[s.status]++;
      } else {
        counts.submitted = (counts.submitted || 0) + 1;
      }
    });

    return Object.entries(counts)
      .filter(([, val]) => val > 0)
      .map(([key, val]) => ({
        name: STATUS_LABELS[key] || key,
        value: val,
        key,
        color: STATUS_COLORS[key] || "#94a3b8",
      }));
  }, [submissions]);

  if (submissions.length === 0) {
    return (
      <div className="card-flat rounded-2xl p-12 text-center text-neutral-400">
        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary-500" />
        <p className="font-semibold text-neutral-700">Belum Ada Data Aktivitas Siswa</p>
        <p className="text-sm mt-1 text-neutral-400">
          Grafik progres akan terisi otomatis setelah siswa mengumpulkan jawaban LKPD.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Bar Chart Comparison */}
        <div className="lg:col-span-2 card-flat rounded-2xl p-6 bg-white border border-neutral-100 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-primary-600" />
                Perbandingan Nilai Siswa per LKPD
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Evaluasi otomatis Groq AI dibandingkan dengan nilai final validasi guru
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-neutral-400">Rata-rata Skor: </span>
              <span className="text-sm font-extrabold text-primary-600">
                {averageScore}%
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  domain={[0, (dataMax: number) => Math.max(dataMax, 50)]}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-neutral-200 rounded-xl p-3 shadow-lg text-xs space-y-1">
                          <p className="font-bold text-neutral-900">{data.fullName}</p>
                          <p className="text-neutral-500">LKPD: {data.lkpdTitle}</p>
                          <div className="pt-1.5 border-t border-neutral-100 flex items-center justify-between gap-4">
                            <span className="text-teal-600 font-semibold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Skor AI:
                            </span>
                            <span className="font-bold text-teal-700">
                              {data.skorAI}/{data.maxScore}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-primary-600 font-semibold">
                              Nilai Final:
                            </span>
                            <span className="font-bold text-primary-700">
                              {data.nilaiFinal}/{data.maxScore} ({data.percentage}%)
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
                />
                <Bar
                  dataKey="skorAI"
                  name="Skor AI (Groq)"
                  fill="#0d9488"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />
                <Bar
                  dataKey="nilaiFinal"
                  name="Nilai Validasi"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Pie Chart Distribution */}
        <div className="card-flat rounded-2xl p-6 bg-white border border-neutral-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Status Koreksi
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Proporsi penyelesaian tugas mahasiswa
            </p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0];
                      return (
                        <div className="bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 shadow-md text-xs">
                          <p className="font-semibold text-neutral-800">
                            {item.name}: <span className="font-bold">{item.value} tugas</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center counter */}
            <div className="absolute text-center pointer-events-none">
              <p className="text-2xl font-extrabold text-neutral-900 leading-none">
                {submissions.length}
              </p>
              <p className="text-[10px] text-neutral-400 font-medium uppercase mt-0.5">
                Total LKPD
              </p>
            </div>
          </div>

          {/* Legend items */}
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            {pieData.map((item) => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-neutral-600 font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </span>
                <span className="font-bold text-neutral-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Student Progress Breakdown Table */}
      <div className="card-flat rounded-2xl overflow-hidden bg-white border border-neutral-100 shadow-xs">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-neutral-900">Daftar Pengumpulan & Analitik Nilai</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Rincian tugas masuk beserta nilai hasil koreksi Groq AI
            </p>
          </div>
          <Link
            href="/dashboard/guru/grading"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            Buka Halaman Koreksi <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold uppercase tracking-wider border-b border-neutral-100">
              <tr>
                <th className="py-3 px-5">Mahasiswa</th>
                <th className="py-3 px-5">Tugas LKPD</th>
                <th className="py-3 px-5">Skor AI (Groq)</th>
                <th className="py-3 px-5">Nilai Final</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {submissions.map((sub) => {
                const statusBadge =
                  sub.status === "validated" ? (
                    <span className="badge badge-success text-[11px]">
                      <CheckCircle2 className="w-3 h-3" /> Tervalidasi
                    </span>
                  ) : sub.status === "ai_graded" ? (
                    <span className="badge badge-ai text-[11px]">
                      <Sparkles className="w-3 h-3" /> Selesai AI
                    </span>
                  ) : (
                    <span className="badge badge-warning text-[11px]">
                      <Clock className="w-3 h-3" /> Menunggu
                    </span>
                  );

                return (
                  <tr key={sub.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-neutral-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-xs">
                          {sub.student_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="leading-tight">{sub.student_name}</p>
                          {sub.student_email && (
                            <p className="text-[11px] text-neutral-400 font-normal">
                              {sub.student_email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-medium">{sub.lkpd_title}</td>
                    <td className="py-3.5 px-5">
                      {sub.ai_score !== null ? (
                        <span className="text-teal-700 font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-teal-500" />
                          {sub.ai_score}/{sub.max_score}
                        </span>
                      ) : (
                        <span className="text-neutral-400 italic">Belum dikoreksi</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-neutral-900">
                      {sub.final_score !== null ? (
                        <span className="text-primary-700 font-extrabold">
                          {sub.final_score}/{sub.max_score}
                        </span>
                      ) : (
                        <span className="text-neutral-400 font-normal italic">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">{statusBadge}</td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/dashboard/guru/grading?lkpdId=${sub.lkpd_id}`}
                        className="btn-secondary text-[11px] py-1 px-2.5 inline-flex"
                      >
                        Lihat Koreksi
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
