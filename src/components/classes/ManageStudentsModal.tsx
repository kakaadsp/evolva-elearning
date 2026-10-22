"use client";

import { useEffect, useState, useMemo } from "react";
import {
  X,
  Search,
  Check,
  Users,
  AlertCircle,
  Save,
  GraduationCap,
} from "lucide-react";
import toast from "react-hot-toast";

export interface Student {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
}

interface ManageStudentsModalProps {
  classId: string;
  classNameText?: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (enrolledCount: number) => void;
}

export default function ManageStudentsModal({
  classId,
  classNameText,
  isOpen,
  onClose,
  onUpdated,
}: ManageStudentsModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [initialEnrolled, setInitialEnrolled] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "enrolled" | "unenrolled">("all");

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/classes/${classId}/members`, {
          cache: "no-store",
        });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Gagal memuat daftar siswa.");
        }

        if (isMounted) {
          setStudents(json.students || []);
          const enrolled = json.enrolledUserIds || [];
          setSelected(enrolled);
          setInitialEnrolled(enrolled);
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Gagal memuat data anggota kelas.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, classId]);

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase().trim();
    return students.filter((s) => {
      const matchesSearch =
        !q ||
        s.full_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const isEnrolled = selected.includes(s.id);
      if (activeTab === "enrolled") return isEnrolled;
      if (activeTab === "unenrolled") return !isEnrolled;
      return true;
    });
  }, [students, search, activeTab, selected]);

  const toggleStudent = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllVisible = () => {
    const current = new Set(selected);
    filteredStudents.forEach((s) => current.add(s.id));
    setSelected(Array.from(current));
  };

  const deselectAllVisible = () => {
    const visibleIds = new Set(filteredStudents.map((s) => s.id));
    setSelected((prev) => prev.filter((id) => !visibleIds.has(id)));
  };

  const hasChanges = useMemo(() => {
    if (selected.length !== initialEnrolled.length) return true;
    const initialSet = new Set(initialEnrolled);
    return selected.some((id) => !initialSet.has(id));
  }, [selected, initialEnrolled]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/classes/${classId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selected }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal menyimpan perubahan siswa.");
      }

      toast.success(
        `Daftar siswa berhasil disimpan (${selected.length} siswa terdaftar).`
      );
      setInitialEnrolled(selected);
      onUpdated?.(selected.length);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0]?.[0] || "S").toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box max-w-xl w-full flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-neutral-900">
                Kelola Siswa Kelas
              </h3>
              <p className="text-xs text-neutral-500">
                {classNameText ? (
                  <>
                    Kelas: <strong className="text-neutral-800">{classNameText}</strong>
                  </>
                ) : (
                  "Atur siswa yang memiliki akses ke kelas ini"
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost p-2 rounded-lg text-neutral-400 hover:text-neutral-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Counter & Tabs */}
        <div className="pt-4 pb-2 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Filter Tabs */}
            <div className="flex bg-neutral-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === "all"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                Semua ({students.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("enrolled")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === "enrolled"
                    ? "bg-white text-primary-700 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                Terdaftar ({selected.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("unenrolled")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === "unenrolled"
                    ? "bg-white text-neutral-700 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                Belum ({Math.max(0, students.length - selected.length)})
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={selectAllVisible}
                className="text-primary-600 hover:text-primary-700 font-semibold px-2 py-1 rounded hover:bg-primary-50 transition-colors"
              >
                Pilih Semua
              </button>
              <span className="text-neutral-300">|</span>
              <button
                type="button"
                onClick={deselectAllVisible}
                className="text-neutral-500 hover:text-neutral-700 font-medium px-2 py-1 rounded hover:bg-neutral-100 transition-colors"
              >
                Batal Pilih
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email siswa..."
              className="input-field input-with-leading-icon !pl-10 text-xs py-2 w-full"
            />
          </div>
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1 min-h-[220px] max-h-[360px]">
          {loading ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-neutral-400">Memuat data siswa...</p>
            </div>
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((student) => {
              const isChecked = selected.includes(student.id);
              const wasEnrolled = initialEnrolled.includes(student.id);

              return (
                <div
                  key={student.id}
                  onClick={() => toggleStudent(student.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? "border-primary-300 bg-primary-50/60 shadow-xs"
                      : "border-neutral-200/70 bg-white hover:border-neutral-300 hover:bg-neutral-50/70"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isChecked
                          ? "bg-primary-600 text-white"
                          : "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {getInitials(student.full_name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900 truncate">
                          {student.full_name}
                        </span>
                        {wasEnrolled && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 shrink-0">
                            Terdaftar
                          </span>
                        )}
                        {!wasEnrolled && isChecked && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 shrink-0">
                            Baru Dipilih
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {student.email}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ml-3 ${
                      isChecked
                        ? "bg-primary-600 border-primary-600 text-white"
                        : "border-neutral-300 bg-white"
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center text-neutral-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold">
                {students.length === 0
                  ? "Belum ada akun siswa aktif di sistem."
                  : "Tidak ada siswa yang sesuai kriteria pencarian."}
              </p>
            </div>
          )}
        </div>

        {/* Changes summary indicator */}
        {hasChanges && (
          <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Ada perubahan belum disimpan. Klik &quot;Simpan Perubahan&quot; untuk menerapkan.</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 pt-4 mt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost flex-1 justify-center text-xs py-2.5"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="btn-primary flex-1 justify-center text-xs py-2.5"
          >
            {saving ? (
              <>
                <div className="spinner !border-white/30 !border-t-white" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Perubahan ({selected.length} Siswa)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
