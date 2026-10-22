"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TopNav from "@/components/layout/TopNav";
import toast from "react-hot-toast";
import {
  Plus,
  Save,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
  GripVertical,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Hash,
  Award,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import type { LKPDQuestion } from "@/types";

const defaultQuestion = (id = "question-initial"): LKPDQuestion => ({
  id,
  question_text: "Jelaskan konsep yang kamu pelajari...",
  question_type: "essay",
  max_points: 10,
  rubric_hint: "",
});

export default function LKPDEditorPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [modules, setModules] = useState<{ id: string; title: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState(
    `## Petunjuk Pengerjaan\n\n1. Baca materi terlebih dahulu sebelum mengerjakan.\n2. Jawab setiap pertanyaan dengan **lengkap dan sistematis**.\n3. Gunakan notasi LaTeX untuk rumus, contoh: $E = mc^2$\n\n### Rumus Referensi\n\n$$\\int_a^b f(x)\\,dx = F(b) - F(a)$$`
  );
  const [questions, setQuestions] = useState<LKPDQuestion[]>([defaultQuestion()]);
  const [deadline, setDeadline] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedQ, setExpandedQ] = useState<Record<string, boolean>>({});

  const supabase = createClient();

  const maxScore = useMemo(() => {
    return questions.reduce((acc, q) => acc + (Number(q.max_points) || 0), 0);
  }, [questions]);

  const fetchClasses = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: memberClasses }, { data: createdClasses }] =
      await Promise.all([
        supabase
          .from("kelas_members")
          .select("kelas:kelas!kelas_members_kelas_id_fkey(id, name)")
          .eq("user_id", user.id)
          .eq("role", "guru"),
        supabase.from("kelas").select("id, name").eq("created_by", user.id),
      ]);

    const classMap = new Map<string, { id: string; name: string }>();
    (createdClasses || []).forEach((c) => {
      if (c?.id) classMap.set(c.id, { id: c.id, name: c.name });
    });
    (memberClasses || []).forEach((row: any) => {
      const c = Array.isArray(row.kelas) ? row.kelas[0] : row.kelas;
      if (c?.id && !classMap.has(c.id)) {
        classMap.set(c.id, { id: c.id, name: c.name });
      }
    });

    const items = Array.from(classMap.values());
    setClasses(items);
    if (items.length > 0 && !selectedClass) {
      setSelectedClass(items[0].id);
    }
  }, [supabase, selectedClass]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (!selectedClass) {
      setModules([]);
      setSelectedModule("");
      return;
    }

    let isMounted = true;
    supabase
      .from("modul_pembelajaran")
      .select("id, title")
      .eq("kelas_id", selectedClass)
      .order("order_index")
      .then(({ data }) => {
        if (isMounted && data) {
          setModules(data);
          if (data.length > 0) {
            setSelectedModule(data[0].id);
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedClass, supabase]);

  function addQuestion() {
    const q = defaultQuestion(`question-${Date.now()}`);
    setQuestions((prev) => [...prev, q]);
    setExpandedQ((prev) => ({ ...prev, [q.id]: true }));
  }

  function removeQuestion(id: string) {
    if (questions.length === 1) {
      toast.error("Minimal harus ada 1 soal dalam LKPD.");
      return;
    }
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function updateQuestion(id: string, field: keyof LKPDQuestion, value: unknown) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  }

  async function handleSave() {
    if (saving) return; // Prevent double trigger

    if (!selectedClass) {
      toast.error("Silakan pilih kelas terlebih dahulu.");
      return;
    }

    if (!selectedModule) {
      toast.error("Silakan pilih modul pembelajaran terlebih dahulu.");
      return;
    }

    if (!title.trim()) {
      toast.error("Judul LKPD wajib diisi.");
      return;
    }

    if (questions.length === 0) {
      toast.error("Minimal harus ada 1 soal.");
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Sesi login berakhir.");

      const { data: existing } = await supabase
        .from("lkpd")
        .select("order_index")
        .eq("modul_id", selectedModule)
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { error } = await supabase.from("lkpd").insert({
        modul_id: selectedModule,
        title: title.trim(),
        description: description.trim() || null,
        instructions: instructions.trim(),
        questions,
        max_score: maxScore,
        is_available: isAvailable,
        deadline: deadline || null,
        order_index: ((existing?.order_index as number | null) ?? 0) + 1,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("LKPD berhasil disimpan! 🎉");
      router.push("/dashboard/guru/lkpd");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan LKPD");
      setSaving(false);
    }
  }

  return (
    <div>
      <TopNav
        title="Buat LKPD Baru"
        breadcrumbs={[
          { label: "Guru", href: "/dashboard/guru" },
          { label: "LKPD", href: "/dashboard/guru/lkpd" },
          { label: "Buat Baru" },
        ]}
      />

      <div className="p-6 space-y-6 max-w-7xl">
        {/* Top Action Bar (Clean, Unified, No Overlapping) */}
        <div className="card-flat rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-neutral-200/80">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-ghost text-xs py-2 px-3 text-neutral-600 hover:text-neutral-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>

            <div className="h-5 w-px bg-neutral-200 hidden sm:block" />

            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={`btn-secondary text-xs py-2 px-3.5 transition-colors ${
                previewMode ? "bg-primary-50 border-primary-400 text-primary-700" : ""
              }`}
              id="toggle-preview"
            >
              {previewMode ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {previewMode ? "Mode Edit" : "Mode Preview"}
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl">
              <Award className="w-4 h-4 text-ai-600" />
              <span className="text-xs text-neutral-500 font-medium">Total Skor:</span>
              <span className="text-xs font-bold text-neutral-900">
                {maxScore} poin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Status toggle properly enclosed without text overlapping */}
            <div className="flex items-center gap-2.5 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-semibold text-neutral-700">
                {isAvailable ? "Publikasi (Aktif)" : "Draft"}
              </span>
              <label
                className="toggle cursor-pointer shrink-0"
                title="Aktifkan agar mahasiswa dapat mengakses LKPD ini"
              >
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  id="toggle-available"
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Single Primary Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-xs py-2 px-5"
              id="save-lkpd-btn"
            >
              {saving ? (
                <>
                  <div className="spinner !border-white/30 !border-t-white" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan LKPD
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT: Metadata & Class/Module */}
          <div className="space-y-4">
            <div className="card-flat rounded-2xl p-5 space-y-4 border border-neutral-200/80">
              <h3 className="font-bold text-neutral-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary-600" />
                Informasi LKPD
              </h3>

              {/* Class selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">
                  Kelas <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                  }}
                  className="input-field text-xs py-2"
                  id="select-class"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Module selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">
                  Modul Pembelajaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="input-field text-xs py-2"
                  disabled={!selectedClass}
                  id="select-module"
                >
                  <option value="">
                    {selectedClass
                      ? modules.length
                        ? "-- Pilih Modul --"
                        : "Belum ada modul di kelas ini"
                      : "Pilih kelas terlebih dahulu"}
                  </option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">
                  Judul LKPD <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field text-xs py-2"
                  placeholder="Contoh: LKPD 1 - Konsep Turunan Fungsi"
                  id="lkpd-title"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">
                  Deskripsi LKPD (Opsional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field text-xs py-2 resize-none"
                  rows={2}
                  placeholder="Deskripsi singkat mengenai target latihan LKPD ini..."
                  id="lkpd-desc"
                />
              </div>

              {/* Deadline */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">
                  Batas Waktu Pengumpulan (Opsional)
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="input-field text-xs py-2"
                  id="lkpd-deadline"
                />
              </div>
            </div>

            {/* LaTeX Quick Cheat Sheet */}
            <div className="card-flat rounded-2xl p-4 bg-amber-50/70 border border-amber-200/80">
              <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                <span>💡</span> Tips Penulisan Rumus LaTeX
              </p>
              <div className="space-y-1 text-[11px] text-amber-900 font-mono">
                <p>
                  Inline: <code>$E = mc^2$</code>
                </p>
                <p>
                  Block: <code>$$\int_a^b f(x)\,dx$$</code>
                </p>
                <p>
                  Pecahan: <code>$\frac{"{a}{b}"}$</code>
                </p>
                <p>
                  Akar: <code>$\sqrt{"{x}"}$</code>
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Instructions + Questions */}
          <div className="lg:col-span-2 space-y-5">
            {/* Instructions editor */}
            <div className="card-flat rounded-2xl overflow-hidden border border-neutral-200/80">
              <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-neutral-50/50">
                <h3 className="font-bold text-neutral-900 text-xs flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary-600" />
                  Petunjuk & Materi LKPD (Markdown + LaTeX)
                </h3>
              </div>
              {previewMode ? (
                <div className="p-5 prose-evolva min-h-[220px]">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                  >
                    {instructions}
                  </ReactMarkdown>
                </div>
              ) : (
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="editor-area w-full rounded-none font-mono text-xs leading-relaxed"
                  rows={10}
                  id="lkpd-instructions"
                  placeholder="Tulis petunjuk dalam Markdown + LaTeX..."
                />
              )}
            </div>

            {/* Questions list */}
            <div className="card-flat rounded-2xl overflow-hidden border border-neutral-200/80">
              <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-neutral-50/50">
                <div>
                  <h3 className="font-bold text-neutral-900 text-xs">
                    Daftar Soal Latihan
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {questions.length} soal terdaftar · {maxScore} poin total
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="btn-secondary text-xs py-1.5 px-3"
                  id="add-question-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Soal
                </button>
              </div>

              <div className="divide-y divide-neutral-100">
                {questions.map((q, i) => (
                  <div key={q.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                        <GripVertical className="w-4 h-4 text-neutral-300" />
                        <span className="text-[11px] font-bold text-neutral-600 uppercase bg-neutral-100 px-2 py-0.5 rounded-md">
                          Soal {i + 1}
                        </span>

                        <select
                          value={q.question_type}
                          onChange={(e) =>
                            updateQuestion(q.id, "question_type", e.target.value)
                          }
                          className="text-xs border border-neutral-200 rounded-lg px-2 py-1 text-neutral-700 bg-white"
                          id={`q-type-${q.id}`}
                        >
                          <option value="essay">Essay / Uraian</option>
                          <option value="short_answer">Jawaban Singkat</option>
                          <option value="calculation">Perhitungan</option>
                        </select>

                        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                          <input
                            type="number"
                            value={q.max_points}
                            onChange={(e) =>
                              updateQuestion(
                                q.id,
                                "max_points",
                                Number(e.target.value)
                              )
                            }
                            className="w-14 text-xs border border-neutral-200 rounded-lg px-2 py-1 text-center font-bold text-primary-700"
                            min={1}
                            id={`q-points-${q.id}`}
                            title="Poin maksimal soal"
                          />
                          <span className="text-xs text-neutral-400">poin</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedQ((prev) => ({
                              ...prev,
                              [q.id]: !prev[q.id],
                            }))
                          }
                          title={
                            expandedQ[q.id]
                              ? "Tutup Rubrik Penilaian"
                              : "Buka Rubrik Penilaian"
                          }
                          className="btn-ghost p-1.5 text-neutral-500 hover:text-neutral-800"
                        >
                          {expandedQ[q.id] ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          title="Hapus Soal"
                          className="btn-ghost p-1.5 text-neutral-400 hover:text-rose-600"
                          id={`remove-q-${q.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question text */}
                    {previewMode ? (
                      <div className="prose-evolva text-xs p-3 rounded-xl border border-neutral-100 bg-neutral-50/50">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {q.question_text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <textarea
                        value={q.question_text}
                        onChange={(e) =>
                          updateQuestion(q.id, "question_text", e.target.value)
                        }
                        className="editor-area w-full text-xs font-mono"
                        rows={3}
                        placeholder="Tulis pertanyaan soal dengan Markdown + LaTeX..."
                        id={`q-text-${q.id}`}
                      />
                    )}

                    {/* Rubric hint for AI grading (expandable) */}
                    {expandedQ[q.id] && (
                      <div className="p-3 rounded-xl bg-primary-50/40 border border-primary-100 space-y-1.5">
                        <label className="text-[11px] font-bold text-primary-800 flex items-center gap-1">
                          Rubrik / Petunjuk Penilaian untuk Koreksi AI
                        </label>
                        <textarea
                          value={q.rubric_hint ?? ""}
                          onChange={(e) =>
                            updateQuestion(q.id, "rubric_hint", e.target.value)
                          }
                          className="input-field text-xs resize-none bg-white"
                          rows={2}
                          placeholder="Contoh: Berikan nilai 10 jika mahasiswa menyebutkan definisi limit dengan benar dan menurunkan f'(x) secara bertahap..."
                          id={`q-rubric-${q.id}`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Action Footer with Clean Alignment (Single unified save trigger) */}
            <div className="flex items-center justify-between p-4 card-flat rounded-2xl border border-neutral-200/80">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-ghost text-xs py-2 px-3 text-neutral-600"
              >
                <ArrowLeft className="w-4 h-4" />
                Batal
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary text-xs py-2 px-6"
                id="save-lkpd-bottom"
              >
                {saving ? (
                  <>
                    <div className="spinner !border-white/30 !border-t-white" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan LKPD
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
