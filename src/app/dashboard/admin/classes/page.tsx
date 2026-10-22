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
import AddStudents from "@/components/classes/AddStudents";
import StudentPicker from "@/components/classes/StudentPicker";

interface MemberItem {
  user_id: string;
  role: string;
}

interface KelasData {
  id: string;
  name: string;
  description?: string;
  subject: string;
  semester: string;
  academic_year: string;
  is_active: boolean;
  created_at: string;
  members?: MemberItem[];
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
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
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
      .select(`
        *,
        members:kelas_members(user_id, role)
      `)
      .order("created_at", { ascending: false });
    if (data) setClasses(data as KelasData[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const filtered = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave() {
    if (!form.name || !form.subject) {
      toast.error("Nama dan mata kuliah wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      if (editClass) {
        const { error } = await supabase
          .from("kelas")
          .update(form)
          .eq("id", editClass.id);
        if (error) throw error;
        toast.success("Kelas berhasil diperbarui.");
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { data: newClass, error } = await supabase
          .from("kelas")
          .insert({ ...form, created_by: user!.id })
          .select("id")
          .single();

        if (error) throw error;

        // If students were selected during creation, enroll them
        if (selectedStudentIds.length > 0 && newClass?.id) {
          const membersToInsert = selectedStudentIds.map((studentId) => ({
            kelas_id: newClass.id,
            user_id: studentId,
            role: "siswa",
          }));

          const { error: membersError } = await supabase
            .from("kelas_members")
            .insert(membersToInsert);

          if (membersError) {
            toast.error(
              `Kelas dibuat, namun gagal mendaftarkan siswa: ${membersError.message}`
            );
          }
        }

        toast.success(
          selectedStudentIds.length > 0
            ? `Kelas baru berhasil dibuat dengan ${selectedStudentIds.length} siswa!`
            : "Kelas baru berhasil dibuat!"
        );
      }
      setShowModal(false);
      setEditClass(null);
      setSelectedStudentIds([]);
      fetchClasses();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan kelas");
    } finally {
      setSaving(false);
    }
  }

  function openCreate() {
    setEditClass(null);
    setSelectedStudentIds([]);
    setForm({
      name: "",
      description: "",
      subject: "",
      semester: "1",
      academic_year: "2024/2025",
      is_active: true,
    });
    setShowModal(true);
  }

  function openEdit(c: KelasData) {
    setEditClass(c);
    setSelectedStudentIds([]);
    setForm({
      name: c.name,
      description: c.description || "",
      subject: c.subject,
      semester: c.semester,
      academic_year: c.academic_year,
      is_active: c.is_active,
    });
    setShowModal(true);
  }

  async function toggleActive(c: KelasData) {
    await supabase
      .from("kelas")
      .update({ is_active: !c.is_active })
      .eq("id", c.id);
    toast.success(c.is_active ? "Kelas dinonaktifkan." : "Kelas diaktifkan.");
    fetchClasses();
  }

  return (
    <div>
      <TopNav
        title="Pengelolaan Kelas"
        breadcrumbs={[
          { label: "Admin", href: "/dashboard/admin" },
          { label: "Kelas" },
        ]}
      />
      <div className="p-6 space-y-5">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari kelas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field input-with-leading-icon !pl-10 w-56 text-xs py-2"
              id="search-classes"
            />
          </div>
          <button
            onClick={openCreate}
            className="btn-primary text-xs py-2"
            id="add-class-btn"
          >
            <Plus className="w-4 h-4" /> Buat Kelas
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="card-flat rounded-2xl p-5 space-y-3 animate-pulse"
              >
                <div className="skeleton h-5 w-3/4 rounded-lg" />
                <div className="skeleton h-3 w-1/2 rounded-lg" />
                <div className="skeleton h-8 w-full rounded-xl" />
              </div>
            ))
          ) : filtered.length > 0 ? (
            filtered.map((c) => {
              const studentCount = (c.members || []).filter(
                (m) => m.role === "siswa"
              ).length;

              return (
                <div
                  key={c.id}
                  className="card-flat rounded-2xl p-5 flex flex-col justify-between gap-3 border border-neutral-200/80 hover:shadow-md transition-shadow"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-neutral-900 text-sm truncate">
                            {c.name}
                          </h3>
                          <p className="text-xs text-neutral-500 truncate">
                            {c.subject}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`badge text-xs shrink-0 ${
                          c.is_active ? "badge-success" : "badge-error"
                        }`}
                      >
                        {c.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
                      <span className="flex items-center gap-1.5 font-semibold text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded-lg">
                        <Users className="w-3.5 h-3.5 text-primary-600" />
                        {studentCount} Siswa
                      </span>
                      <span>
                        Sem. {c.semester} · {c.academic_year}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-neutral-100">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="btn-ghost text-xs flex-1 justify-center py-1.5"
                        id={`edit-class-${c.id}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => toggleActive(c)}
                        className="btn-ghost text-xs flex-1 justify-center py-1.5"
                        id={`toggle-class-${c.id}`}
                      >
                        {c.is_active ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                        {c.is_active ? "Nonaktif" : "Aktifkan"}
                      </button>
                    </div>

                    <AddStudents
                      classId={c.id}
                      classNameText={c.name}
                      buttonText="Kelola Siswa"
                      buttonVariant="secondary"
                      onUpdated={() => fetchClasses()}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20 text-neutral-400 card-flat rounded-2xl">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Belum ada kelas</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal-box max-w-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <h3 className="text-xl font-extrabold text-neutral-900">
                {editClass ? "Edit Kelas" : "Buat Kelas Baru"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="btn-ghost p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {[
                {
                  label: "Nama Kelas",
                  id: "class-name",
                  value: form.name,
                  field: "name",
                  placeholder: "Contoh: Kelas Kalkulus A",
                },
                {
                  label: "Mata Kuliah/Pelajaran",
                  id: "class-subject",
                  value: form.subject,
                  field: "subject",
                  placeholder: "Contoh: Kalkulus Integral",
                },
                {
                  label: "Deskripsi (opsional)",
                  id: "class-desc",
                  value: form.description,
                  field: "description",
                  placeholder: "Deskripsi singkat kelas...",
                },
              ].map((f) => (
                <div key={f.id} className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    {f.label}
                  </label>
                  <input
                    type="text"
                    value={f.value}
                    onChange={(e) =>
                      setForm({ ...form, [f.field]: e.target.value })
                    }
                    className="input-field text-xs py-2"
                    placeholder={f.placeholder}
                    id={f.id}
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    Semester
                  </label>
                  <select
                    value={form.semester}
                    onChange={(e) =>
                      setForm({ ...form, semester: e.target.value })
                    }
                    className="input-field text-xs py-2"
                    id="class-semester"
                  >
                    {["1", "2", "3", "4", "5", "6", "7", "8"].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    Tahun Akademik
                  </label>
                  <input
                    type="text"
                    value={form.academic_year}
                    onChange={(e) =>
                      setForm({ ...form, academic_year: e.target.value })
                    }
                    className="input-field text-xs py-2"
                    id="class-year"
                  />
                </div>
              </div>

              {/* Student Picker when creating a new class */}
              {!editClass && (
                <div className="pt-3 border-t border-neutral-100">
                  <StudentPicker
                    selectedIds={selectedStudentIds}
                    onChange={setSelectedStudentIds}
                    label="Pilih Siswa Awal (Opsional)"
                    description="Pilih siswa yang langsung didaftarkan ke kelas baru ini."
                    maxHeight="max-h-52"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 mt-3 border-t border-neutral-100">
              <button
                onClick={() => setShowModal(false)}
                className="btn-ghost flex-1 justify-center text-xs py-2.5"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 justify-center text-xs py-2.5"
                id="save-class-btn"
              >
                {saving ? (
                  <>
                    <div className="spinner !border-white/30 !border-t-white" />{" "}
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Simpan{" "}
                    {!editClass &&
                      selectedStudentIds.length > 0 &&
                      `(${selectedStudentIds.length} Siswa)`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
