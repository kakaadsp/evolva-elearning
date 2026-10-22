"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Plus,
  Sparkles,
  Search,
  Calendar,
  Award,
  Trash2,
  Eye,
  EyeOff,
  Edit3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import TopNav from "@/components/layout/TopNav";
import toast from "react-hot-toast";

interface LKPDItem {
  id: string;
  title: string;
  description?: string;
  max_score: number;
  is_available: boolean;
  deadline?: string;
  created_at: string;
  modul_pembelajaran?: {
    id: string;
    title: string;
    kelas?: {
      id: string;
      name: string;
    };
  };
}

export default function GuruLKPDPage() {
  const [items, setItems] = useState<LKPDItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchLKPD = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("lkpd")
        .select(`
          id,
          title,
          description,
          max_score,
          is_available,
          deadline,
          created_at,
          modul_pembelajaran (
            id,
            title,
            kelas (
              id,
              name
            )
          )
        `)
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems((data as unknown as LKPDItem[]) || []);
    } catch (err) {
      console.error("Error fetching LKPD:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchLKPD();
  }, [fetchLKPD]);

  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.modul_pembelajaran?.title || "").toLowerCase().includes(search.toLowerCase())
  );

  async function toggleStatus(item: LKPDItem) {
    try {
      const { error } = await supabase
        .from("lkpd")
        .update({ is_available: !item.is_available })
        .eq("id", item.id);

      if (error) throw error;
      toast.success(
        item.is_available ? "LKPD dinonaktifkan." : "LKPD berhasil diaktifkan!"
      );
      fetchLKPD();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengubah status LKPD."
      );
    }
  }

  async function handleDelete(item: LKPDItem) {
    if (!confirm(`Hapus LKPD "${item.title}"? Semua pengumpulan tugas terkait akan ikut terhapus.`)) {
      return;
    }

    setDeletingId(item.id);
    try {
      const { error } = await supabase
        .from("lkpd")
        .delete()
        .eq("id", item.id);

      if (error) throw error;
      toast.success("LKPD berhasil dihapus.");
      fetchLKPD();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menghapus LKPD."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <TopNav
        title="LKPD Guru"
        breadcrumbs={[
          { label: "Guru", href: "/dashboard/guru" },
          { label: "LKPD" },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-neutral-900">
              LKPD Interaktif
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Lembar Kerja Peserta Didik berbasis AI & LaTeX untuk latihan mahasiswa.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari LKPD atau modul..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field input-with-leading-icon !pl-10 text-xs py-2 w-56 sm:w-64"
              />
            </div>

            <Link href="/dashboard/guru/lkpd/new" className="btn-ai text-xs py-2">
              <Plus className="w-4 h-4" />
              Buat LKPD
            </Link>
          </div>
        </div>

        {/* LKPD Cards Grid */}
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
            filtered.map((item) => {
              const moduleName = item.modul_pembelajaran?.title || "Tanpa Modul";
              const className = item.modul_pembelajaran?.kelas?.name || "";

              return (
                <div
                  key={item.id}
                  className="card-flat rounded-2xl p-5 flex flex-col justify-between gap-4 border border-neutral-200/80 hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-ai-50 flex items-center justify-center shrink-0 text-ai-600">
                          <ClipboardCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-sm text-neutral-900 truncate">
                            {item.title}
                          </h3>
                          <p className="text-xs text-neutral-500 truncate">
                            {moduleName} {className && `· ${className}`}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`badge text-[11px] shrink-0 ${
                          item.is_available ? "badge-success" : "badge-neutral"
                        }`}
                      >
                        {item.is_available ? "Aktif" : "Draft"}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-neutral-600 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="flex items-center gap-1 font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md">
                        <Award className="w-3.5 h-3.5 text-ai-600" />
                        Maks. {item.max_score} Poin
                      </span>

                      {item.deadline && (
                        <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(item.deadline).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-neutral-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/dashboard/guru/lkpd/${item.id}/edit`}
                        className="btn-secondary text-xs py-2 px-2.5 justify-center flex items-center gap-1.5 font-semibold text-neutral-700 hover:text-neutral-900"
                        id={`edit-lkpd-${item.id}`}
                      >
                        <Edit3 className="w-3.5 h-3.5 text-primary-600" />
                        Edit LKPD
                      </Link>

                      <Link
                        href={`/dashboard/guru/grading?lkpdId=${item.id}`}
                        className="btn-ai text-xs py-2 px-2.5 justify-center flex items-center gap-1.5 font-semibold"
                        title="Koreksi Pengumpulan Siswa"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Koreksi / Nilai
                      </Link>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => toggleStatus(item)}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium py-1 px-2 rounded-lg transition-colors ${
                          item.is_available
                            ? "text-emerald-700 hover:bg-emerald-50"
                            : "text-amber-700 hover:bg-amber-50"
                        }`}
                        title={
                          item.is_available
                            ? "Klik untuk nonaktifkan (jadikan draft)"
                            : "Klik untuk aktifkan (publikasikan)"
                        }
                      >
                        {item.is_available ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Status: Aktif</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                            <span>Status: Draft</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={deletingId === item.id}
                        onClick={() => handleDelete(item)}
                        title="Hapus LKPD"
                        className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-rose-600 hover:bg-rose-50 py-1 px-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center card-flat rounded-2xl">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p className="font-bold text-neutral-800">Belum ada LKPD</p>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 mb-4">
                {search
                  ? "Tidak ada LKPD yang cocok dengan pencarian Anda."
                  : "Mulai buat LKPD interaktif pertama Anda untuk melatih mahasiswa."}
              </p>
              {!search && (
                <Link
                  href="/dashboard/guru/lkpd/new"
                  className="btn-ai text-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Buat LKPD Baru
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
