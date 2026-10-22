"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Save } from "lucide-react";
import toast from "react-hot-toast";
import TopNav from "@/components/layout/TopNav";
import { createClient } from "@/lib/supabase/client";
import StudentPicker from "@/components/classes/StudentPicker";

export default function NewGuruClassPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    name: "",
    subject: "",
    description: "",
    semester: "1",
    academic_year: "2025/2026",
  });
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim()) {
      toast.error("Nama kelas dan mata pelajaran wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Sesi login berakhir. Silakan login kembali.");

      // 1. Create class
      const { data: kelas, error: classError } = await supabase
        .from("kelas")
        .insert({
          ...form,
          created_by: user.id,
          is_active: true,
        })
        .select("id")
        .single();

      if (classError) {
        throw new Error(`Gagal membuat kelas: ${classError.message}`);
      }

      // 2. Register teacher as class member
      const { error: memberError } = await supabase.from("kelas_members").insert({
        kelas_id: kelas.id,
        user_id: user.id,
        role: "guru",
      });

      if (memberError) {
        throw new Error(
          `Kelas dibuat, tetapi gagal mendaftarkan guru: ${memberError.message}`
        );
      }

      // 3. Register selected students (if any)
      if (selectedStudentIds.length > 0) {
        const studentMembers = selectedStudentIds.map((studentId) => ({
          kelas_id: kelas.id,
          user_id: studentId,
          role: "siswa",
        }));

        const { error: studentsError } = await supabase
          .from("kelas_members")
          .insert(studentMembers);

        if (studentsError) {
          toast.error(
            `Kelas dibuat, namun gagal menambahkan siswa: ${studentsError.message}`
          );
        }
      }

      toast.success(
        selectedStudentIds.length > 0
          ? `Kelas berhasil dibuat dengan ${selectedStudentIds.length} siswa.`
          : "Kelas berhasil dibuat."
      );

      router.push("/dashboard/guru/classes");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal membuat kelas."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <TopNav
        title="Buat Kelas Baru"
        breadcrumbs={[
          { label: "Guru", href: "/dashboard/guru" },
          { label: "Kelas Saya", href: "/dashboard/guru/classes" },
          { label: "Buat Baru" },
        ]}
      />

      <div className="p-6 max-w-4xl">
        <form
          onSubmit={submit}
          className="card-flat rounded-2xl p-6 sm:p-8 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-3 pb-5 border-b border-neutral-100">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-neutral-900">
                Buat Kelas Baru
              </h2>
              <p className="text-sm text-neutral-500">
                Siapkan ruang belajar dan daftarkan siswa secara langsung.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-neutral-700">
                Nama Kelas <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
                placeholder="Contoh: Matematika Diskrit - Kelas A"
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-neutral-700">
                Mata Kuliah / Pelajaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="input-field"
                placeholder="Contoh: Matematika Diskrit"
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-neutral-700">
                Deskripsi Kelas (Opsional)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="input-field py-2"
                placeholder="Deskripsi singkat mengenai target dan materi pembelajaran kelas ini..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">Semester</label>
              <select
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                className="input-field"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={String(s)}>
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
                className="input-field"
                placeholder="Contoh: 2025/2026"
              />
            </div>
          </div>

          {/* Student Picker section */}
          <div className="pt-4 border-t border-neutral-100">
            <StudentPicker
              selectedIds={selectedStudentIds}
              onChange={setSelectedStudentIds}
              label="Tambahkan Siswa ke Kelas Ini"
              description="Pilih siswa aktif yang akan langsung dimasukkan ke dalam kelas ini saat dibuat."
              maxHeight="max-h-72"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-ghost text-xs py-2.5 px-4"
            >
              <ArrowLeft className="w-4 h-4" /> Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-xs py-2.5 px-6 ml-auto"
            >
              {saving ? (
                <>
                  <div className="spinner !border-white/30 !border-t-white" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Simpan Kelas{" "}
                  {selectedStudentIds.length > 0 &&
                    `(${selectedStudentIds.length} Siswa)`}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
