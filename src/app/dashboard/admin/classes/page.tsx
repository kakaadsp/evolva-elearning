"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import TopNav from "@/components/layout/TopNav";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  BookOpen,
  Users,
  Edit3,
  X,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

interface KelasData {
  id: string;
  name: string;
  description?: string;
  subject: string;
  semester: string;
  academic_year: string;
  is_active: boolean;
  created_at: string;
}

interface FormData {
  name: string;
  description: string;
  subject: string;
  semester: string;
  academic_year: string;
  is_active: boolean;
}

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<KelasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editClass, setEditClass] = useState<KelasData | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: "",
    description: "",
    subject: "",
    semester: "1",
    academic_year: "2024/2025",
    is_active: true,
  });

  const supabase = createClient();

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("kelas")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setClasses(data as KelasData[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const filtered = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave() {
    if (!form.name || !form.subject) { toast.error("Nama dan mata kuliah wajib diisi."); return; }
    setSaving(true);
    try {
      if (editClass) {
        const { error } = await supabase.from("kelas").update(form).eq("id", editClass.id);
        if (error) throw error;
        toast.success("Kelas berhasil diperbarui.");
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("kelas").insert({ ...form, created_by: user!.id });
        if (error) throw error;
        toast.success("Kelas baru berhasil dibuat!");
      }
      setShowModal(false);
      setEditClass(null);
      fetchClasses();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan kelas");
    } finally {
      setSaving(false);
    }
  }

  function openCreate() {
    setEditClass(null);
    setForm({ name: "", description: "", subject: "", semester: "1", academic_year: "2024/2025", is_active: true });
    setShowModal(true);
  }

  function openEdit(c: KelasData) {
    setEditClass(c);
    setForm({ name: c.name, description: c.description || "", subject: c.subject, semester: c.semester, academic_year: c.academic_year, is_active: c.is_active });
    setShowModal(true);
  }

  async function toggleActive(c: KelasData) {
    await supabase.from("kelas").update({ is_active: !c.is_active }).eq("id", c.id);
    toast.success(c.is_active ? "Kelas dinonaktifkan." : "Kelas diaktifkan.");
    fetchClasses();
  }

  return (
    <div>
      <TopNav
        title="Pengelolaan Kelas"
        breadcrumbs={[{ label: "Admin", href: "/dashboard/admin" }, { label: "Kelas" }]}
      />
      <div className="p-6 space-y-5">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input type="text" placeholder="Cari kelas..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 w-56" id="search-classes" />
          </div>
          <button onClick={openCreate} className="btn-primary" id="add-class-btn">
            <Plus className="w-4 h-4" /> Buat Kelas
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-flat rounded-2xl p-5 space-y-3">
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
                <div className="skeleton h-8 w-full rounded-xl" />
              </div>
            ))
          ) : filtered.length > 0 ? (
            filtered.map((c) => (
              <div key={c.id} className="card-flat rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 text-sm">{c.name}</h3>
                      <p className="text-xs text-neutral-500">{c.subject}</p>
                    </div>
                  </div>
                  <span className={`badge text-xs ${c.is_active ? "badge-success" : "badge-error"}`}>
                    {c.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>

                <div className="text-xs text-neutral-400 flex items-center gap-3">
                  <span>Sem. {c.semester}</span>
                  <span>·</span>
                  <span>{c.academic_year}</span>
                </div>

                <div className="flex gap-2 mt-auto pt-2 border-t border-neutral-100">
                  <button onClick={() => openEdit(c)} className="btn-ghost text-xs flex-1 justify-center" id={`edit-class-${c.id}`}>
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => toggleActive(c)} className="btn-ghost text-xs flex-1 justify-center" id={`toggle-class-${c.id}`}>
                    {c.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {c.is_active ? "Nonaktif" : "Aktifkan"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-neutral-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Belum ada kelas</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-extrabold text-neutral-900">
                {editClass ? "Edit Kelas" : "Buat Kelas Baru"}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-2"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              {[
                { label: "Nama Kelas", id: "class-name", value: form.name, field: "name", placeholder: "Contoh: Kelas Kalkulus A" },
                { label: "Mata Kuliah/Pelajaran", id: "class-subject", value: form.subject, field: "subject", placeholder: "Contoh: Kalkulus Integral" },
                { label: "Deskripsi (opsional)", id: "class-desc", value: form.description, field: "description", placeholder: "Deskripsi singkat kelas..." },
              ].map((f) => (
                <div key={f.id} className="space-y-1.5">
                  <label className="text-sm font-semibold text-neutral-700">{f.label}</label>
                  <input type="text" value={f.value} onChange={(e) => setForm({ ...form, [f.field]: e.target.value })}
                    className="input-field" placeholder={f.placeholder} id={f.id} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-neutral-700">Semester</label>
                  <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    className="input-field" id="class-semester">
                    {["1","2","3","4","5","6","7","8"].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-neutral-700">Tahun Akademik</label>
                  <input type="text" value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                    className="input-field" id="class-year" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1 justify-center">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center" id="save-class-btn">
                {saving ? <><div className="spinner !border-white/30 !border-t-white" /> Menyimpan...</> : <><Save className="w-4 h-4" /> Simpan</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
