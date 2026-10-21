import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, ClipboardCheck, FileText, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import TopNav from "@/components/layout/TopNav";

export const metadata: Metadata = { title: "Detail Kelas" };

type Props = { params: Promise<{ classId: string }> };

export default async function SiswaClassDetailPage({ params }: Props) {
  const { classId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("kelas_members")
    .select("id")
    .eq("kelas_id", classId)
    .eq("user_id", user.id)
    .eq("role", "siswa")
    .maybeSingle();

  if (!membership) {
    return (
      <div>
        <TopNav title="Kelas" breadcrumbs={[{ label: "Siswa", href: "/dashboard/siswa" }, { label: "Kelas" }]} />
        <div className="p-6"><div className="card-flat rounded-2xl p-10 text-center">
          <h2 className="text-xl font-bold text-neutral-900">Kelas tidak ditemukan</h2>
          <p className="text-sm text-neutral-500 mt-2">Kamu belum terdaftar sebagai siswa di kelas ini.</p>
          <Link href="/dashboard/siswa/classes" className="btn-primary inline-flex mt-5">Kembali ke Kelas Saya</Link>
        </div></div>
      </div>
    );
  }

  const { data: kelas } = await supabase
    .from("kelas")
    .select("id, name, description, subject, semester, academic_year")
    .eq("id", classId)
    .maybeSingle();

  const { data: modules } = await supabase
    .from("modul_pembelajaran")
    .select("id, title, description, order_index")
    .eq("kelas_id", classId)
    .eq("is_available", true)
    .order("order_index", { ascending: true });

  const moduleIds = (modules ?? []).map((module) => module.id);
  const { data: materials } = moduleIds.length
    ? await supabase
        .from("materi")
        .select("id, modul_id, title, description, content, content_type")
        .in("modul_id", moduleIds)
        .eq("is_available", true)
        .order("order_index", { ascending: true })
    : { data: [] };
  const { data: lkpds } = moduleIds.length
    ? await supabase
        .from("lkpd")
        .select("id, modul_id, title, description, max_score, deadline")
        .in("modul_id", moduleIds)
        .eq("is_available", true)
        .order("order_index", { ascending: true })
    : { data: [] };

  return (
    <div>
      <TopNav title={kelas?.name ?? "Kelas"} breadcrumbs={[{ label: "Siswa", href: "/dashboard/siswa" }, { label: "Kelas Saya", href: "/dashboard/siswa/classes" }, { label: kelas?.name ?? "Detail" }]} />
      <div className="p-6 space-y-6">
        <Link href="/dashboard/siswa/classes" className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-semibold"><ArrowLeft className="w-4 h-4" />Kembali ke Kelas Saya</Link>
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-teal-500 to-ai-600 text-white">
          <div className="relative z-10"><div className="flex items-center gap-2 text-white/80 text-sm"><GraduationCap className="w-5 h-5" />Kelas Aktif</div><h1 className="text-2xl font-extrabold mt-2">{kelas?.name ?? "Kelas"}</h1><p className="text-white/80 mt-1">{kelas?.subject} · Semester {kelas?.semester} · {kelas?.academic_year}</p>{kelas?.description && <p className="text-white/70 text-sm mt-3 max-w-2xl">{kelas.description}</p>}</div>
        </div>
        <div className="space-y-4">
          {(modules ?? []).length ? (modules ?? []).map((module) => {
            const moduleMaterials = (materials ?? []).filter((item) => item.modul_id === module.id);
            const moduleLkpds = (lkpds ?? []).filter((item) => item.modul_id === module.id);
            return <section key={module.id} className="card-flat rounded-2xl overflow-hidden"><div className="p-5 border-b border-neutral-100"><h2 className="font-bold text-lg text-neutral-900">{module.title}</h2>{module.description && <p className="text-sm text-neutral-500 mt-1">{module.description}</p>}</div><div className="p-5 space-y-3">{moduleMaterials.map((item) => <details key={item.id} className="rounded-xl border border-neutral-100 p-4 group"><summary className="flex items-center gap-3 cursor-pointer list-none"><div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center"><FileText className="w-4 h-4 text-primary-600" /></div><div><p className="font-semibold text-sm">{item.title}</p><p className="text-xs text-neutral-400">Materi {item.content_type} · klik untuk membaca</p></div></summary><div className="mt-4 pt-4 border-t border-neutral-100 whitespace-pre-wrap text-sm leading-6 text-neutral-600">{item.content || "Materi belum memiliki isi."}</div></details>)}{moduleLkpds.map((item) => <Link key={item.id} href={`/dashboard/siswa/lkpd/${item.id}`} className="rounded-xl border border-ai-100 bg-ai-50/30 p-4 flex items-center gap-3 hover:bg-ai-50 transition-colors"><div className="w-9 h-9 rounded-lg bg-ai-100 flex items-center justify-center"><ClipboardCheck className="w-4 h-4 text-ai-600" /></div><div><p className="font-semibold text-sm">{item.title}</p><p className="text-xs text-neutral-500">LKPD · Maks. {item.max_score} poin · klik untuk mengerjakan</p></div></Link>)}{!moduleMaterials.length && !moduleLkpds.length && <p className="text-sm text-neutral-400">Belum ada materi atau LKPD yang dipublikasikan.</p>}</div></section>;
          }) : <div className="card-flat rounded-2xl p-12 text-center"><BookOpen className="w-10 h-10 mx-auto mb-3 text-neutral-300" /><p className="font-semibold text-neutral-600">Belum ada modul pembelajaran</p><p className="text-sm text-neutral-400 mt-1">Materi dan LKPD akan muncul setelah guru mempublikasikan modul.</p></div>}
        </div>
      </div>
    </div>
  );
}
