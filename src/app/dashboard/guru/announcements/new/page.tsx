"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Megaphone, Save } from "lucide-react";
import toast from "react-hot-toast";
import TopNav from "@/components/layout/TopNav";
import { createClient } from "@/lib/supabase/client";

type ClassOption = { id: string; name: string };

export default function NewAnnouncementPage() {
  const router = useRouter();
  const supabase = createClient();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadClasses() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("kelas_members")
        .select("kelas:kelas!kelas_members_kelas_id_fkey(id,name)")
        .eq("user_id", user.id).eq("role", "guru");
      const options = (data ?? []).map((item: { kelas: ClassOption | ClassOption[] | null }) => Array.isArray(item.kelas) ? item.kelas[0] : item.kelas).filter((item): item is ClassOption => Boolean(item));
      setClasses(options);
      if (options[0]) setClassId(options[0].id);
    }
    loadClasses();
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!classId || !title.trim() || !content.trim()) { toast.error("Kelas, judul, dan isi wajib diisi."); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi login berakhir.");
      const { error } = await supabase.from("pengumuman").insert({ kelas_id: classId, title: title.trim(), content: content.trim(), is_pinned: pinned, created_by: user.id });
      if (error) throw error;
      toast.success("Pengumuman berhasil dibuat."); router.push("/dashboard/guru/announcements"); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Gagal membuat pengumuman."); } finally { setSaving(false); }
  }

  return <div><TopNav title="Buat Pengumuman" breadcrumbs={[{ label: "Guru", href: "/dashboard/guru" }, { label: "Pengumuman", href: "/dashboard/guru/announcements" }, { label: "Buat Baru" }]} /><div className="p-6"><form onSubmit={handleSubmit} className="card-flat rounded-2xl p-6 max-w-3xl space-y-5"><div className="flex items-center gap-3 pb-4 border-b border-neutral-100"><div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center"><Megaphone className="w-5 h-5 text-violet-600" /></div><div><h2 className="text-xl font-bold">Pengumuman Kelas</h2><p className="text-sm text-neutral-500">Bagikan informasi kepada mahasiswa.</p></div></div><div><label className="text-sm font-semibold">Kelas</label><select value={classId} onChange={(e) => setClassId(e.target.value)} className="input-field mt-1.5" disabled={!classes.length}><option value="">{classes.length ? "Pilih kelas" : "Belum ada kelas yang diampu"}</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div><label className="text-sm font-semibold">Judul</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field mt-1.5" placeholder="Contoh: Jadwal pengumpulan LKPD" /></div><div><label className="text-sm font-semibold">Isi Pengumuman</label><textarea value={content} onChange={(e) => setContent(e.target.value)} className="input-field mt-1.5 resize-y" rows={6} placeholder="Tulis informasi untuk kelas..." /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />Sematkan pengumuman</label><div className="flex gap-3"><button type="button" onClick={() => router.back()} className="btn-ghost"><ArrowLeft className="w-4 h-4" />Batal</button><button type="submit" disabled={saving || !classes.length} className="btn-primary"><Save className="w-4 h-4" />{saving ? "Menyimpan..." : "Terbitkan Pengumuman"}</button></div></form></div></div>;
}
