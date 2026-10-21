import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Plus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import TopNav from "@/components/layout/TopNav";
import AddStudents from "@/components/classes/AddStudents";

export const metadata: Metadata = { title: "Kelas Saya" };

export default async function GuruClassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: memberships } = await supabase.from("kelas_members")
    .select("kelas:kelas!kelas_members_kelas_id_fkey(id,name,subject,semester,academic_year,is_active)")
    .eq("user_id", user?.id ?? "").eq("role", "guru");

  return <div><TopNav title="Kelas Saya" breadcrumbs={[{ label: "Guru", href: "/dashboard/guru" }, { label: "Kelas Saya" }]} />
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Kelas yang Andaampu</h2><p className="text-sm text-neutral-500 mt-1">Kelola kelas dan materi pembelajaran.</p></div><Link href="/dashboard/guru/classes/new" className="btn-primary"><Plus className="w-4 h-4" />Buat Kelas</Link></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{memberships?.map((item: any) => { const k = Array.isArray(item.kelas) ? item.kelas[0] : item.kelas; return <div key={k?.id} className="card-flat rounded-2xl p-5 space-y-4"><div className="flex items-start justify-between"><div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center"><BookOpen className="w-5 h-5 text-primary-600" /></div><span className={`badge ${k?.is_active ? "badge-success" : "badge-neutral"}`}>{k?.is_active ? "Aktif" : "Nonaktif"}</span></div><div><h3 className="font-bold">{k?.name}</h3><p className="text-sm text-neutral-500">{k?.subject} · Semester {k?.semester}</p></div><p className="text-xs text-neutral-400 flex items-center gap-1"><Users className="w-3.5 h-3.5" />Tahun akademik {k?.academic_year}</p></div>; })}</div>
      {memberships?.map((item: any) => { const k = Array.isArray(item.kelas) ? item.kelas[0] : item.kelas; return k?.id ? <div key={`manage-${k.id}`} className="card-flat rounded-2xl p-4"><p className="text-sm font-semibold mb-2">Kelola siswa: {k.name}</p><AddStudents classId={k.id} /></div> : null; })}
      {(!memberships || memberships.length === 0) && <div className="card-flat rounded-2xl py-16 text-center text-neutral-400"><BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>Belum ada kelas yang ditugaskan.</p></div>}
    </div></div>;
}
