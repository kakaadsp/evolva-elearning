"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Save,
  Plus,
  Eye,
  Edit3,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import TopNav from "@/components/layout/TopNav";
import { createClient } from "@/lib/supabase/client";

interface EditMaterialPageProps {
  params: Promise<{ id: string }>;
}

type Option = { id: string; name?: string; title?: string };

export default function EditMaterialPage({ params }: EditMaterialPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Option[]>([]);
  const [modules, setModules] = useState<Option[]>([]);
  const [classId, setClassId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [available, setAvailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingModule, setCreatingModule] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  // Load teacher classes
  useEffect(() => {
    async function loadClasses() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: memberClasses }, { data: createdClasses }] =
        await Promise.all([
          supabase
            .from("kelas_members")
            .select("kelas:kelas!kelas_members_kelas_id_fkey(id,name)")
            .eq("user_id", user.id)
            .eq("role", "guru"),
          supabase
            .from("kelas")
            .select("id, name")
            .eq("created_by", user.id),
        ]);

      const classMap = new Map<string, Option>();
      (createdClasses || []).forEach((c) => {
        if (c?.id) classMap.set(c.id, c);
      });
      (memberClasses || []).forEach((row: any) => {
        const c = Array.isArray(row.kelas) ? row.kelas[0] : row.kelas;
        if (c?.id && !classMap.has(c.id)) classMap.set(c.id, c);
      });

      setClasses(Array.from(classMap.values()));
    }
    loadClasses();
  }, [supabase]);

  // Load existing material data
  useEffect(() => {
    async function loadMaterial() {
      setLoading(true);
      try {
        const res = await fetch(`/api/materials/${id}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Gagal memuat data materi.");
        }

        const m = json.material;
        setTitle(m.title || "");
        setContent(m.content || "");
        setAvailable(Boolean(m.is_available));

        if (m.modul_id) {
          setModuleId(m.modul_id);
          const cId = m.modul_pembelajaran?.kelas_id;
          if (cId) setClassId(cId);
        }
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Gagal memuat data materi."
        );
      } finally {
        setLoading(false);
      }
    }

    loadMaterial();
  }, [id]);

  // Load modules when classId changes
  useEffect(() => {
    async function loadModules() {
      if (!classId) return;
      const { data } = await supabase
        .from("modul_pembelajaran")
        .select("id, title")
        .eq("kelas_id", classId)
        .order("order_index");

      setModules(data ?? []);
    }
    loadModules();
  }, [classId, supabase]);

  async function createModule() {
    if (!classId || !moduleTitle.trim()) {
      toast.error("Pilih kelas dan isi nama modul.");
      return;
    }
    setCreatingModule(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi login berakhir.");

      const { data, error } = await supabase
        .from("modul_pembelajaran")
        .insert({
          kelas_id: classId,
          title: moduleTitle.trim(),
          created_by: user.id,
          is_available: true,
        })
        .select("id,title")
        .single();

      if (error) throw error;
      setModules((current) => [...current, data]);
      setModuleId(data.id);
      setModuleTitle("");
      toast.success("Modul baru berhasil dibuat.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal membuat modul."
      );
    } finally {
      setCreatingModule(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Judul materi wajib diisi.");
      return;
    }
    if (!content.trim()) {
      toast.error("Isi materi tidak boleh kosong.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/materials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          is_available: available,
          modul_id: moduleId || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal memperbarui materi.");
      }

      toast.success("Materi berhasil diperbarui! 🎉");
      router.push("/dashboard/guru/materials");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan materi."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <TopNav
        title="Edit Materi"
        breadcrumbs={[
          { label: "Guru", href: "/dashboard/guru" },
          { label: "Materi", href: "/dashboard/guru/materials" },
          { label: title || "Edit Materi" },
        ]}
      />

      <div className="p-6">
        {loading ? (
          <div className="card-flat rounded-2xl p-12 text-center space-y-3 max-w-4xl">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-neutral-500 font-medium">
              Memuat data materi...
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="card-flat rounded-2xl p-6 sm:p-8 max-w-4xl space-y-6"
          >
            {/* Header */}
            <div className="flex items-center gap-3 pb-5 border-b border-neutral-100">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-neutral-900">
                  Edit Materi Pembelajaran
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Perbaiki judul, isi Markdown & LaTeX, modul, atau status publikasi materi.
                </p>
              </div>
            </div>

            {/* Class & Module Selector */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">
                  Kelas
                </label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="input-field text-xs py-2"
                >
                  <option value="">
                    {classes.length ? "Pilih kelas" : "Belum ada kelas"}
                  </option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">
                  Modul Pembelajaran
                </label>
                <select
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                  className="input-field text-xs py-2"
                  disabled={!classId}
                >
                  <option value="">
                    {classId
                      ? modules.length
                        ? "Pilih modul"
                        : "Belum ada modul di kelas ini"
                      : "Pilih kelas dahulu"}
                  </option>
                  {modules.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick add module if needed */}
            {classId && (
              <div className="flex gap-2">
                <input
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="input-field text-xs py-2"
                  placeholder="Buat modul baru untuk kelas ini (contoh: Turunan & Integral)"
                />
                <button
                  type="button"
                  onClick={createModule}
                  disabled={creatingModule || !moduleTitle.trim()}
                  className="btn-secondary text-xs px-3 py-2 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  {creatingModule ? "Membuat..." : "Buat Modul"}
                </button>
              </div>
            )}

            {/* Material Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">
                Judul Materi <span className="text-rose-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field text-xs py-2.5 font-medium"
                placeholder="Contoh: Pengantar Kalkulus"
                required
              />
            </div>

            {/* Content Editor with Write / Preview Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-700">
                  Isi Materi (Markdown & LaTeX) <span className="text-rose-500">*</span>
                </label>

                <div className="flex bg-neutral-100 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab("write")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                      activeTab === "write"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Tulis
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                      activeTab === "preview"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Pratinjau
                  </button>
                </div>
              </div>

              {activeTab === "write" ? (
                <div className="space-y-1.5">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="editor-area w-full font-mono text-xs leading-relaxed"
                    rows={14}
                    placeholder="# Judul Materi&#10;&#10;Tulis materi, penjelasan konsep, dan rumus LaTeX (contoh: $f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}$) di sini..."
                    required
                  />
                  <p className="text-[11px] text-neutral-400">
                    Mendukung format Markdown standar (`# Judul`, `**tebal**`, `- list`) dan formula matematika LaTeX.
                  </p>
                </div>
              ) : (
                <div className="min-h-[300px] max-h-[460px] overflow-y-auto p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 text-xs leading-relaxed">
                  {content ? (
                    <div className="whitespace-pre-wrap text-neutral-800 font-sans">
                      {content}
                    </div>
                  ) : (
                    <p className="text-neutral-400 italic">
                      Belum ada teks isi materi untuk dipratinjau.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Publication Status Toggle */}
            <div className="pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200/80 bg-neutral-50/50 cursor-pointer hover:bg-neutral-50 transition-colors">
                <input
                  type="checkbox"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                />
                <div>
                  <span className="text-xs font-bold text-neutral-900 block">
                    Publikasikan Materi untuk Mahasiswa
                  </span>
                  <span className="text-[11px] text-neutral-500 block">
                    Jika dicentang, mahasiswa yang terdaftar di kelas modul ini dapat langsung membaca materi.
                  </span>
                </div>
              </label>
            </div>

            {/* Actions */}
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
                    Menyimpan Perubahan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
