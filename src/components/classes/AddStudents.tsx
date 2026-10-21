"use client";

import { useEffect, useState } from "react";
import { UserPlus, X, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

type Student = { id: string; full_name: string; email: string };

export default function AddStudents({ classId }: { classId: string }) {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const [{ data: profiles }, { data: members }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").eq("role", "siswa").eq("is_active", true).order("full_name"),
        supabase.from("kelas_members").select("user_id").eq("kelas_id", classId),
      ]);
      setStudents((profiles ?? []) as Student[]);
      setSelected((members ?? []).map((member) => member.user_id));
      setLoading(false);
    })();
  }, [open, classId, supabase]);

  async function save() {
    setLoading(true);
    try {
      const { data: existing } = await supabase.from("kelas_members").select("user_id").eq("kelas_id", classId).eq("role", "siswa");
      const existingIds = new Set((existing ?? []).map((member) => member.user_id));
      const added = selected.filter((id) => !existingIds.has(id)).map((user_id) => ({ kelas_id: classId, user_id, role: "siswa" }));
      const removed = [...existingIds].filter((user_id) => !selected.includes(user_id));
      if (added.length) {
        const { error } = await supabase.from("kelas_members").insert(added);
        if (error) throw error;
      }
      if (removed.length) {
        const { error } = await supabase.from("kelas_members").delete().eq("kelas_id", classId).in("user_id", removed).eq("role", "siswa");
        if (error) throw error;
      }
      toast.success("Daftar siswa berhasil diperbarui.");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui siswa.");
    } finally { setLoading(false); }
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="btn-secondary w-full justify-center text-xs"><UserPlus className="w-3.5 h-3.5" />Tambah Siswa</button>
    {open && <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && setOpen(false)}><div className="modal-box max-w-lg"><div className="flex items-center justify-between mb-4"><div><h3 className="text-xl font-extrabold">Tambah Siswa ke Kelas</h3><p className="text-sm text-neutral-400 mt-1">Pilih siswa yang dapat mengakses materi dan LKPD.</p></div><button onClick={() => setOpen(false)} className="btn-ghost p-2"><X className="w-5 h-5" /></button></div><div className="max-h-72 overflow-y-auto space-y-2">{loading ? <p className="text-sm text-neutral-400 py-8 text-center">Memuat siswa...</p> : students.length ? students.map((student) => { const checked = selected.includes(student.id); return <button type="button" key={student.id} onClick={() => setSelected((current) => checked ? current.filter((id) => id !== student.id) : [...current, student.id])} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left ${checked ? "border-primary-300 bg-primary-50" : "border-neutral-100 hover:bg-neutral-50"}`}><span className={`w-5 h-5 rounded-md border flex items-center justify-center ${checked ? "bg-primary-600 border-primary-600 text-white" : "border-neutral-300"}`}>{checked && <Check className="w-3.5 h-3.5" />}</span><span><span className="block text-sm font-semibold">{student.full_name}</span><span className="block text-xs text-neutral-400">{student.email}</span></span></button>; }) : <p className="text-sm text-neutral-400 py-8 text-center">Belum ada akun siswa aktif.</p>}</div><div className="flex gap-3 mt-5"><button onClick={() => setOpen(false)} className="btn-ghost flex-1 justify-center">Batal</button><button onClick={save} disabled={loading} className="btn-primary flex-1 justify-center">{loading ? "Menyimpan..." : "Simpan Siswa"}</button></div></div></div>}
  </>;
}
