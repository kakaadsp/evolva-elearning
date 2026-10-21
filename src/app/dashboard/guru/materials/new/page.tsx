"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, FileText, Plus, Save } from "lucide-react";
import toast from "react-hot-toast";
import TopNav from "@/components/layout/TopNav";
import { createClient } from "@/lib/supabase/client";

type Option = { id: string; name?: string; title?: string };

export default function NewMaterialPage() {
  const router = useRouter();
  const supabase = createClient();
  const [classes, setClasses] = useState<Option[]>([]);
  const [modules, setModules] = useState<Option[]>([]);
  const [classId, setClassId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [available, setAvailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingModule, setCreatingModule] = useState(false);

  useEffect(() => {
    async function loadClasses() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("kelas_members").select("kelas:kelas!kelas_members_kelas_id_fkey(id,name)").eq("user_id", user.id).eq("role", "guru");
      const items = (data ?? []).map((row: { kelas: Option | Option[] | null }) => Array.isArray(row.kelas) ? row.kelas[0] : row.kelas).filter((item): item is Option => Boolean(item));
      setClasses(items);
      if (items[0]) setClassId(items[0].id);
    }
    loadClasses();
  }, [supabase]);

  useEffect(() => {
    async function loadModules() {
      if (!classId) { setModules([]); setModuleId(""); return; }
      const { data } = await supabase.from("modul_pembelajaran").select("id,title").eq("kelas_id", classId).order("order_index");
      setModules(data ?? []);
      setModuleId(data?.[0]?.id ?? "");
    }
    loadModules();
  }, [classId, supabase]);

  async function createModule() {
    if (!classId || !moduleTitle.trim()) { toast.error("Pilih kelas dan isi nama modul."); return; }
    setCreatingModule(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi login berakhir.");
      const { data, error } = await supabase.from("modul_pembelajaran").insert({ kelas_id: classId, title: moduleTitle.trim(), created_by: user.id, is_available: true }).select("id,title").single();
      if (error) throw error;
      setModules((current) => [...current, data]); setModuleId(data.id); setModuleTitle(""); toast.success("Modul berhasil dibuat.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Gagal membuat modul."); } finally { setCreatingModule(false); }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!moduleId || !title.trim() || !content.trim()) { toast.error("Modul, judul, dan isi materi wajib diisi."); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi login berakhir.");
      const { error } = await supabase.from("materi").insert({ modul_id: moduleId, title: title.trim(), content: content.trim(), is_available: available, content_type: "text", created_by: user.id });
      if (error) throw error;
      toast.success("Materi berhasil disimpan."); router.push("/dashboard/guru/materials"); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Gagal menyimpan materi."); } finally { setSaving(false); }
  }

  return <div><TopNav title="Tambah Materi" breadcrumbs={[{ label: "Guru", href: "/dashboard/guru" }, { label: "Materi", href: "/dashboard/guru/materials" }, { label: "Tambah" }]} /><div className="p-6"><form onSubmit={submit} className="card-flat rounded-2xl p-6 max-w-4xl space-y-5"><div className="flex items-center gap-3 pb-4 border-b border-neutral-100"><div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center"><FileText className="w-5 h-5 text-primary-600" /></div><div><h2 className="text-xl font-bold">Materi Markdown & LaTeX</h2><p className="text-sm text-neutral-500">Tentukan kelas dan modul sebelum menyimpan materi.</p></div></div><div className="grid sm:grid-cols-2 gap-4"><div><label className="text-sm font-semibold">Kelas</label><select value={classId} onChange={(e) => setClassId(e.target.value)} className="input-field mt-1.5"><option value="">{classes.length ? "Pilih kelas" : "Belum ada kelas"}</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div><label className="text-sm font-semibold">Modul Pembelajaran</label><select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="input-field mt-1.5" disabled={!classId}><option value="">{classId ? (modules.length ? "Pilih modul" : "Belum ada modul") : "Pilih kelas dahulu"}</option>{modules.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div></div><div className="flex gap-2"><input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} className="input-field" placeholder="Nama modul baru, contoh: Turunan" disabled={!classId} /><button type="button" onClick={createModule} disabled={creatingModule || !classId} className="btn-secondary shrink-0"><Plus className="w-4 h-4" />{creatingModule ? "Membuat..." : "Buat Modul"}</button></div><div><label className="text-sm font-semibold">Judul Materi</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field mt-1.5" placeholder="Contoh: Pengantar Kalkulus" /></div><div><label className="text-sm font-semibold">Isi Materi</label><textarea value={content} onChange={(e) => setContent(e.target.value)} className="editor-area mt-1.5 w-full" rows={12} placeholder={'# Judul Materi\n\nTulis materi dan rumus LaTeX di sini...'} /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />Publikasikan untuk siswa sekarang</label><div className="flex gap-3"><button type="button" onClick={() => router.back()} className="btn-ghost"><ArrowLeft className="w-4 h-4" />Batal</button><button type="submit" disabled={saving || !moduleId} className="btn-primary"><Save className="w-4 h-4" />{saving ? "Menyimpan..." : "Simpan Materi"}</button></div></form></div></div>;
}
