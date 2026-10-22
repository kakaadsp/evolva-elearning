"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Search,
  BookOpen,
  Calendar,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import TopNav from "@/components/layout/TopNav";
import { createClient } from "@/lib/supabase/client";

interface MaterialItem {
  id: string;
  title: string;
  content: string;
  content_type: string;
  is_available: boolean;
  created_at: string;
  modul_id?: string;
  modul_pembelajaran?: {
    id: string;
    title: string;
    kelas?: {
      id: string;
      name: string;
    };
  };
}

export default function GuruMaterialsPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [previewMaterial, setPreviewMaterial] = useState<MaterialItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("materi")
        .select(`
          id,
          title,
          content,
          content_type,
          is_available,
          created_at,
          modul_id,
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
      setMaterials((data as unknown as MaterialItem[]) || []);
    } catch (err) {
      console.error("Error fetching materials:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const filtered = materials.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.modul_pembelajaran?.title || "").toLowerCase().includes(search.toLowerCase())
  );

  async function toggleAvailable(m: MaterialItem) {
    try {
      const res = await fetch(`/api/materials/${m.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: m.title,
          content: m.content,
          is_available: !m.is_available,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Gagal mengubah status materi.");
      }

      toast.success(
        m.is_available ? "Materi disimpan sebagai draft." : "Materi berhasil diterbitkan!"
      );
      fetchMaterials();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }

  async function handleDelete(m: MaterialItem) {
    if (!confirm(`Hapus materi "${m.title}" secara permanen?`)) {
      return;
    }

    setDeletingId(m.id);
    try {
      const res = await fetch(`/api/materials/${m.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Gagal menghapus materi.");
      }

      toast.success("Materi berhasil dihapus.");
      fetchMaterials();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus materi.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <TopNav
        title="Materi Pembelajaran"
        breadcrumbs={[
          { label: "Guru", href: "/dashboard/guru" },
          { label: "Materi" },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-neutral-900">
              Materi Pembelajaran
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Kelola dan perbaiki isi materi Markdown & formula LaTeX untuk kelas Anda.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari materi atau modul..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field input-with-leading-icon !pl-10 text-xs py-2 w-56 sm:w-64"
              />
            </div>

            <Link
              href="/dashboard/guru/materials/new"
              className="btn-primary text-xs py-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Materi
            </Link>
          </div>
        </div>

        {/* Materials Grid */}
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
            filtered.map((m) => {
              const moduleName = m.modul_pembelajaran?.title || "Tanpa Modul";
              const className = m.modul_pembelajaran?.kelas?.name || "";

              return (
                <div
                  key={m.id}
                  className="card-flat rounded-2xl p-5 flex flex-col justify-between gap-4 border border-neutral-200/80 hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 text-primary-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-sm text-neutral-900 truncate">
                            {m.title}
                          </h3>
                          <p className="text-xs text-neutral-500 truncate">
                            {moduleName} {className && `· ${className}`}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`badge text-[11px] shrink-0 ${
                          m.is_available ? "badge-success" : "badge-neutral"
                        }`}
                      >
                        {m.is_available ? "Terbit" : "Draft"}
                      </span>
                    </div>

                    {/* Content snippet */}
                    {m.content && (
                      <p className="text-xs text-neutral-600 line-clamp-2 bg-neutral-50/80 p-2.5 rounded-xl border border-neutral-100/80 leading-relaxed font-sans">
                        {m.content.replace(/[#*`_]/g, "")}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-neutral-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(m.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span>·</span>
                      <span className="capitalize">{m.content_type}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-neutral-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/dashboard/guru/materials/${m.id}/edit`}
                        className="btn-primary text-xs py-2 px-2.5 justify-center flex items-center gap-1.5 font-semibold"
                        id={`edit-material-${m.id}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Materi
                      </Link>

                      <button
                        type="button"
                        onClick={() => setPreviewMaterial(m)}
                        className="btn-secondary text-xs py-2 px-2.5 justify-center flex items-center gap-1.5 font-semibold text-neutral-700 hover:text-neutral-900"
                        title="Pratinjau Materi"
                      >
                        <Eye className="w-3.5 h-3.5 text-primary-600" />
                        Pratinjau
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => toggleAvailable(m)}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium py-1 px-2 rounded-lg transition-colors ${
                          m.is_available
                            ? "text-emerald-700 hover:bg-emerald-50"
                            : "text-amber-700 hover:bg-amber-50"
                        }`}
                        title={
                          m.is_available
                            ? "Klik untuk jadikan draft"
                            : "Klik untuk publikasikan"
                        }
                      >
                        {m.is_available ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Status: Terbit</span>
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
                        disabled={deletingId === m.id}
                        onClick={() => handleDelete(m)}
                        title="Hapus Materi"
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
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p className="font-bold text-neutral-800">Belum ada materi</p>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 mb-4">
                {search
                  ? "Tidak ada materi yang cocok dengan pencarian Anda."
                  : "Mulai buat materi pembelajaran pertama Anda untuk mahasiswa."}
              </p>
              {!search && (
                <Link
                  href="/dashboard/guru/materials/new"
                  className="btn-primary text-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Materi Baru
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewMaterial && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setPreviewMaterial(null)
          }
        >
          <div className="modal-box max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-neutral-900">
                    {previewMaterial.title}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Modul:{" "}
                    {previewMaterial.modul_pembelajaran?.title || "Tanpa Modul"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMaterial(null)}
                className="btn-ghost p-2 rounded-lg text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 text-xs leading-relaxed whitespace-pre-wrap font-sans text-neutral-800">
                {previewMaterial.content || "(Materi belum memiliki konten)"}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
              <span
                className={`badge text-xs ${
                  previewMaterial.is_available
                    ? "badge-success"
                    : "badge-neutral"
                }`}
              >
                Status: {previewMaterial.is_available ? "Terbit" : "Draft"}
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewMaterial(null)}
                  className="btn-ghost text-xs py-2 px-3"
                >
                  Tutup
                </button>
                <Link
                  href={`/dashboard/guru/materials/${previewMaterial.id}/edit`}
                  className="btn-primary text-xs py-2 px-4"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Buka Halaman Edit
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
