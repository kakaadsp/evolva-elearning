"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Check, Users, UserCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface StudentItem {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
}

interface StudentPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  description?: string;
  maxHeight?: string;
  initialStudents?: StudentItem[];
}

export default function StudentPicker({
  selectedIds,
  onChange,
  label = "Pilih Siswa",
  description = "Pilih siswa yang akan dimasukkan ke dalam kelas ini.",
  maxHeight = "max-h-64",
  initialStudents,
}: StudentPickerProps) {
  const [students, setStudents] = useState<StudentItem[]>(() => initialStudents || []);
  const [loading, setLoading] = useState<boolean>(() => !initialStudents || initialStudents.length === 0);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (initialStudents && initialStudents.length > 0) return;

    let isMounted = true;
    async function loadStudents() {
      try {
        const res = await fetch("/api/students");
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.students) {
            setStudents(json.students as StudentItem[]);
            return;
          }
        }

        // Fallback to direct client
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .eq("role", "siswa")
          .eq("is_active", true)
          .order("full_name", { ascending: true });

        if (error) throw error;
        if (isMounted && data) {
          setStudents(data as StudentItem[]);
        }
      } catch (err) {
        console.error("Gagal memuat daftar siswa:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStudents();
    return () => {
      isMounted = false;
    };
  }, [initialStudents, supabase]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }, [students, search]);

  const toggleStudent = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAllFiltered = () => {
    const currentSet = new Set(selectedIds);
    filtered.forEach((s) => currentSet.add(s.id));
    onChange(Array.from(currentSet));
  };

  const deselectAllFiltered = () => {
    const filteredIdSet = new Set(filtered.map((s) => s.id));
    onChange(selectedIds.filter((id) => !filteredIdSet.has(id)));
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0]?.[0] || "S").toUpperCase();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="text-sm font-bold text-neutral-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-600" />
            {label}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
              {selectedIds.length} dipilih
            </span>
          </label>
          {description && (
            <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
          )}
        </div>

        {students.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={selectAllFiltered}
              className="text-primary-600 hover:text-primary-700 font-semibold px-2 py-1 rounded hover:bg-primary-50 transition-colors"
            >
              Pilih Semua
            </button>
            <span className="text-neutral-300">|</span>
            <button
              type="button"
              onClick={deselectAllFiltered}
              className="text-neutral-500 hover:text-neutral-700 font-medium px-2 py-1 rounded hover:bg-neutral-100 transition-colors"
            >
              Hapus Pilihan
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari siswa berdasarkan nama atau email..."
          className="input-field input-with-leading-icon !pl-10 text-xs py-2 w-full"
        />
      </div>

      <div
        className={`${maxHeight} overflow-y-auto space-y-1.5 pr-1 border border-neutral-200 rounded-xl p-2 bg-neutral-50/50`}
      >
        {loading ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-neutral-400">Memuat data siswa aktif...</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((student) => {
            const isChecked = selectedIds.includes(student.id);
            return (
              <div
                key={student.id}
                onClick={() => toggleStudent(student.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isChecked
                    ? "border-primary-300 bg-primary-50/60 shadow-xs"
                    : "border-neutral-200/70 bg-white hover:border-neutral-300 hover:bg-neutral-50/80"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isChecked
                        ? "bg-primary-600 text-white"
                        : "bg-neutral-200 text-neutral-700"
                    }`}
                  >
                    {getInitials(student.full_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neutral-900 truncate">
                      {student.full_name}
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate">
                      {student.email}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ml-2 ${
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
          <div className="py-8 text-center text-neutral-400">
            <UserCheck className="w-8 h-8 mx-auto mb-1.5 opacity-40" />
            <p className="text-xs font-semibold">
              {students.length === 0
                ? "Belum ada akun siswa aktif di sistem."
                : "Tidak ada siswa yang cocok dengan pencarian."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
