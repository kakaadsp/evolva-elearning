import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import TopNav from "@/components/layout/TopNav";

export const metadata: Metadata = { title: "Materi Guru" };
export default async function GuruMaterialsPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  const { data: materials } = await supabase.from("materi").select("id,title,content_type,is_available,created_at,modul_pembelajaran(title)").eq("created_by", user?.id ?? "").order("created_at", { ascending: false });
  return <div><TopNav title="Materi Pembelajaran" breadcrumbs={[{ label: "Guru", href: "/dashboard/guru" }, { label: "Materi" }]} /><div className="p-6 space-y-5"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Materi Saya</h2><p className="text-sm text-neutral-500 mt-1">Materi Markdown dan LaTeX untuk kelas.</p></div><Link href="/dashboard/guru/materials/new" className="btn-primary"><Plus className="w-4 h-4" />Tambah Materi</Link></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{materials?.map((m: any) => <div key={m.id} className="card-flat rounded-2xl p-5"><div className="flex items-center justify-between mb-4"><div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center"><FileText className="w-5 h-5 text-primary-600" /></div><span className={`badge ${m.is_available ? "badge-success" : "badge-neutral"}`}>{m.is_available ? "Terbit" : "Draft"}</span></div><h3 className="font-bold">{m.title}</h3><p className="text-xs text-neutral-400 mt-1">{m.modul_pembelajaran?.title || "Tanpa modul"} · {m.content_type}</p></div>)}</div>{(!materials || materials.length === 0) && <div className="card-flat rounded-2xl py-16 text-center text-neutral-400"><FileText className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>Belum ada materi.</p></div>}</div></div>;
}
