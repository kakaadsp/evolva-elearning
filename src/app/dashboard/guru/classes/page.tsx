"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Users,
  Search,
  FileText,
  ClipboardCheck,
  Eye,
  EyeOff,
  GraduationCap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import TopNav from "@/components/layout/TopNav";
import AddStudents from "@/components/classes/AddStudents";
import toast from "react-hot-toast";

interface KelasItem {
  id: string;
  name: string;
  subject: string;
  description?: string;
  semester: string;
  academic_year: string;
  is_active: boolean;
  created_at: string;
  members?: { user_id: string; role: string }[];
}

export default function GuruClassesPage() {
  const [classes, setClasses] = useState<KelasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Fetch classes where current user is teacher (via member role or creator)
      const [{ data: memberRows }, { data: createdRows }] = await Promise.all([
        supabase
          .from("kelas_members")
          .select(
            `kelas:kelas!kelas_members_kelas_id_fkey(
              id, name, subject, description, semester, academic_year, is_active, created_at,
              members:kelas_members(user_id, role)
            )`
          )
          .eq("user_id", user.id)
          .eq("role", "guru"),
        supabase
          .from("kelas")
          .select(
            `id, name, subject, description, semester, academic_year, is_active, created_at,
             members:kelas_members(user_id, role)`
          )
          .eq("created_by", user.id)
          .order("created_at", { ascending: false }),
      ]);

      const classMap = new Map<string, KelasItem>();

      (createdRows || []).forEach((c: any) => {
        if (c?.id) classMap.set(c.id, c);
      });

      (memberRows || []).forEach((row: any) => {
        const c = Array.isArray(row.kelas) ? row.kelas[0] : row.kelas;
        if (c?.id && !classMap.has(c.id)) {
          classMap.set(c.id, c);
        }
      });

      setClasses(Array.from(classMap.values()));
    } catch (err) {
      console.error("Error fetching guru classes:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const filtered = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleStatus(c: KelasItem) {
    try {
      const { error } = await supabase
        .from("kelas")
        .update({ is_active: !c.is_active })
        .eq("id", c.id);

      if (error) throw error;
      toast.success(
        c.is_active ? "Kelas dinonaktifkan." : "Kelas berhasil diaktifkan."
      );
      fetchClasses();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah status kelas.");
    }
  }

  return (
    <div>
      <TopNav
        title="Kelas Saya"
        breadcrumbs={[
          { label: "Guru", href: "/dashboard/guru" },
          { label: "Kelas Saya" },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-neutral-900">
              Kelas yang Anda Ampu
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Kelola kelas, materi pembelajaran, dan siswa yang terdaftar.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari kelas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field input-with-leading-icon !pl-10 text-xs py-2 w-48 sm:w-60"
              />
            </div>

            <Link href="/dashboard/guru/classes/new" className="btn-primary text-xs py-2">
              <Plus className="w-4 h-4" />
              Buat Kelas
            </Link>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="card-flat rounded-2xl p-5 space-y-3 animate-pulse"
              >
                <div className="skeleton h-5 w-3/4 rounded-lg" />
                <div className="skeleton h-3 w-1/2 rounded-lg" />
                <div className="skeleton h-10 w-full rounded-xl" />
              </div>
            ))
          ) : filtered.length > 0 ? (
            filtered.map((k) => {
              const studentCount = (k.members || []).filter(
                (m) => m.role === "siswa"
              ).length;

              return (
                <div
                  key={k.id}
                  className="card-flat rounded-2xl p-5 flex flex-col justify-between gap-4 border border-neutral-200/80 hover:shadow-md transition-shadow"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0 text-primary-600">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-sm text-neutral-900 truncate">
                            {k.name}
                          </h3>
                          <p className="text-xs text-neutral-500 truncate">
                            {k.subject}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`badge text-[11px] shrink-0 ${
                          k.is_active ? "badge-success" : "badge-neutral"
                        }`}
                      >
                        {k.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>

                    {k.description && (
                      <p className="text-xs text-neutral-600 line-clamp-2">
                        {k.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="flex items-center gap-1.5 text-xs text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-lg font-medium">
                        <Users className="w-3.5 h-3.5 text-primary-600" />
                        {studentCount} Siswa
                      </span>
                      <span className="text-xs text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-lg">
                        Sem. {k.semester} · {k.academic_year}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-neutral-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Link
                        href={`/dashboard/guru/materials?classId=${k.id}`}
                        className="btn-ghost justify-center py-1.5 px-2 text-neutral-600 hover:text-primary-700"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Materi
                      </Link>
                      <Link
                        href={`/dashboard/guru/lkpd?classId=${k.id}`}
                        className="btn-ghost justify-center py-1.5 px-2 text-neutral-600 hover:text-ai-700"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        LKPD
                      </Link>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <AddStudents
                          classId={k.id}
                          classNameText={k.name}
                          buttonText="Kelola Siswa"
                          buttonVariant="secondary"
                          onUpdated={() => fetchClasses()}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleStatus(k)}
                        title={k.is_active ? "Nonaktifkan Kelas" : "Aktifkan Kelas"}
                        className="btn-ghost p-2 text-neutral-400 hover:text-neutral-700 rounded-xl"
                      >
                        {k.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4 text-emerald-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center card-flat rounded-2xl">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p className="font-bold text-neutral-800">Belum ada kelas</p>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 mb-4">
                {search
                  ? "Tidak ada kelas yang cocok dengan kata kunci pencarian Anda."
                  : "Anda belum mengampu kelas apapun. Buat kelas baru untuk memulai pembelajaran."}
              </p>
              {!search && (
                <Link
                  href="/dashboard/guru/classes/new"
                  className="btn-primary text-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Buat Kelas Pertama
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
