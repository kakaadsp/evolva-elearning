import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import TopNav from "@/components/layout/TopNav";
import Link from "next/link";
import {
  Users,
  BookOpen,
  ClipboardCheck,
  Shield,
  TrendingUp,
  AlertCircle,
  UserCheck,
  UserX,
  Plus,
} from "lucide-react";

export const metadata: Metadata = { title: "Dashboard Admin" };

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch stats
  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: totalClasses },
    { count: pendingSubmissions },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("kelas").select("*", { count: "exact", head: true }),
    supabase.from("lkpd_submissions").select("*", { count: "exact", head: true }).eq("status", "submitted"),
  ]);

  // Recent users
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    {
      label: "Total Pengguna",
      value: totalUsers ?? 0,
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-50",
      change: "+12% bulan ini",
      positive: true,
    },
    {
      label: "Pengguna Aktif",
      value: activeUsers ?? 0,
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      change: `${activeUsers ?? 0} dari ${totalUsers ?? 0}`,
      positive: true,
    },
    {
      label: "Total Kelas",
      value: totalClasses ?? 0,
      icon: BookOpen,
      color: "text-primary-600",
      bg: "bg-primary-50",
      change: "Semester aktif",
      positive: true,
    },
    {
      label: "Tugas Menunggu",
      value: pendingSubmissions ?? 0,
      icon: ClipboardCheck,
      color: "text-amber-600",
      bg: "bg-amber-50",
      change: "Perlu dikoreksi AI",
      positive: false,
    },
  ];

  const roleColors: Record<string, string> = {
    admin: "badge-primary",
    guru: "badge-warning",
    siswa: "badge-ai",
  };

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    guru: "Guru",
    siswa: "Siswa",
  };

  return (
    <div>
      <TopNav
        title="Dashboard Administrator"
        breadcrumbs={[{ label: "Admin" }, { label: "Dashboard" }]}
      />
      <div className="p-6 space-y-6">
        {/* Welcome banner */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white/10 rounded-full translate-y-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-semibold text-white/80">Panel Administrator</span>
            </div>
            <h2 className="text-2xl font-extrabold mb-1">Selamat Datang, Admin!</h2>
            <p className="text-white/70 text-sm max-w-md">
              Kelola seluruh akun pengguna, kelas, dan hak akses platform Evolva E-Learning dari sini.
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <TrendingUp className={`w-4 h-4 ${s.positive ? "text-emerald-500" : "text-amber-500"}`} />
              </div>
              <p className="text-3xl font-extrabold text-neutral-900">{s.value}</p>
              <div>
                <p className="text-sm font-semibold text-neutral-700">{s.label}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{s.change}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Content grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Users */}
          <div className="lg:col-span-2 card-flat rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <div>
                <h3 className="font-bold text-neutral-900">Pengguna Terbaru</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Akun yang baru didaftarkan</p>
              </div>
              <Link href="/dashboard/admin/users" className="btn-primary py-2 px-4 text-xs">
                <Plus className="w-3.5 h-3.5" />
                Tambah Pengguna
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Peran</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers && recentUsers.length > 0 ? (
                    recentUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="font-medium">{u.full_name}</td>
                        <td className="text-neutral-500">{u.email}</td>
                        <td>
                          <span className={`badge ${roleColors[u.role] || "badge-neutral"} text-xs`}>
                            {roleLabels[u.role] || u.role}
                          </span>
                        </td>
                        <td>
                          <span className={`badge text-xs ${u.is_active ? "badge-success" : "badge-error"}`}>
                            {u.is_active ? (
                              <><UserCheck className="w-3 h-3" /> Aktif</>
                            ) : (
                              <><UserX className="w-3 h-3" /> Nonaktif</>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-neutral-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        Belum ada pengguna terdaftar
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick actions */}
          <div className="space-y-4">
            <div className="card-flat rounded-2xl p-5">
              <h3 className="font-bold text-neutral-900 mb-4">Aksi Cepat</h3>
              <div className="space-y-2">
                {[
                  { label: "Tambah Pengguna Baru", href: "/dashboard/admin/users", icon: Users, color: "text-violet-600 bg-violet-50" },
                  { label: "Buat Kelas Baru", href: "/dashboard/admin/classes", icon: BookOpen, color: "text-primary-600 bg-primary-50" },
                  { label: "Kelola Hak Akses", href: "/dashboard/admin/users", icon: Shield, color: "text-amber-600 bg-amber-50" },
                ].map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                      <action.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-neutral-700 group-hover:text-primary-600 transition-colors">
                      {action.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* System status */}
            <div className="card-flat rounded-2xl p-5">
              <h3 className="font-bold text-neutral-900 mb-4">Status Sistem</h3>
              <div className="space-y-3">
                {[
                  { name: "Supabase DB", status: "Operasional", color: "text-emerald-600 bg-emerald-50" },
                  { name: "Groq AI API", status: "Operasional", color: "text-emerald-600 bg-emerald-50" },
                  { name: "Auth Service", status: "Operasional", color: "text-emerald-600 bg-emerald-50" },
                ].map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">{s.name}</span>
                    <span className={`badge text-xs ${s.color}`}>
                      <AlertCircle className="w-3 h-3" /> {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
