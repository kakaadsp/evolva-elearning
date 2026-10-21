"use client";

import { useState, useEffect, useCallback } from "react";
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
  ArrowRight,
  GripVertical,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Hash,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import type { LKPD, LKPDQuestion } from "@/types";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

const defaultQuestion: () => LKPDQuestion = () => ({
  id: generateId(),
  question_text: "Jelaskan konsep yang kamu pelajari...",
  question_type: "essay",
  max_points: 10,
  rubric_hint: "",
});

export default function LKPDEditorPage() {
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
  const [maxScore, setMaxScore] = useState(100);
  const [deadline, setDeadline] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedQ, setExpandedQ] = useState<Record<string, boolean>>({});

  const supabase = createClient();

  const fetchClasses = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("kelas_members")
      .select("kelas:kelas!kelas_members_kelas_id_fkey(id, name)")
      .eq("user_id", user!.id)
      .eq("role", "guru");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (data) setClasses((data as any[]).map((c) => {
      const k = Array.isArray(c.kelas) ? c.kelas[0] : c.kelas;
      return k ? { id: k.id as string, name: k.name as string } : null;
    }).filter(Boolean) as { id: string; name: string }[]);
  }, [supabase]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (!selectedClass) { setModules([]); return; }
    supabase
      .from("modul_pembelajaran")
      .select("id, title")
      .eq("kelas_id", selectedClass)
      .order("order_index")
      .then(({ data }) => {
        if (data) setModules(data);
      });
  }, [selectedClass, supabase]);

  function addQuestion() {
    const q = defaultQuestion();
    setQuestions((prev) => [...prev, q]);
    setExpandedQ((prev) => ({ ...prev, [q.id]: true }));
  }

  function removeQuestion(id: string) {
    if (questions.length === 1) { toast.error("Minimal harus ada 1 soal."); return; }
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function updateQuestion(id: string, field: keyof LKPDQuestion, value: unknown) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
    // Recalculate max score
    if (field === "max_points") {
      const updated = questions.map((q) => (q.id === id ? { ...q, max_points: value as number } : q));
      setMaxScore(updated.reduce((acc, q) => acc + q.max_points, 0));
    }
  }

  useEffect(() => {
    setMaxScore(questions.reduce((acc, q) => acc + q.max_points, 0));
  }, [questions]);

  async function handleSave() {
    if (!selectedModule || !title || questions.length === 0) {
      toast.error("Lengkapi judul, modul, dan minimal 1 soal.");
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: existing } = await supabase
        .from("lkpd")
        .select("order_index")
        .eq("modul_id", selectedModule)
        .order("order_index", { ascending: false })
        .limit(1)
        .single();

      const { error } = await supabase.from("lkpd").insert({
        modul_id: selectedModule,
        title,
        description,
        instructions,
        questions,
        max_score: maxScore,
        is_available: isAvailable,
        deadline: deadline || null,
        order_index: ((existing?.order_index as number | null) ?? 0) + 1,
        created_by: user!.id,
      });

      if (error) throw error;
      toast.success("LKPD berhasil disimpan! 🎉");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan LKPD");
    } finally {
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

      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`btn-secondary text-sm py-2 ${previewMode ? "bg-primary-50 border-primary-400" : ""}`}
              id="toggle-preview"
            >
              {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {previewMode ? "Mode Edit" : "Preview"}
            </button>
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-xl">
              <span className="text-xs text-neutral-500">Total Skor:</span>
              <span className="text-sm font-bold text-primary-600">{maxScore} poin</span>
            </div>
          </div>
          <div className="flex gap-3">
            <label className="toggle cursor-pointer flex items-center gap-2" title="Publikasikan ke mahasiswa">
              <span className="text-sm text-neutral-600 font-medium">Publikasi</span>
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                id="toggle-available"
              />
              <span className="toggle-slider" />
            </label>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
              id="save-lkpd-btn"
            >
              {saving ? (
                <><div className="spinner !border-white/30 !border-t-white" /> Menyimpan...</>
              ) : (
                <><Save className="w-4 h-4" /> Simpan LKPD</>
              )}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT: Metadata */}
          <div className="space-y-4">
            <div className="card-flat rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary-600" />
                Informasi LKPD
              </h3>

              {/* Class selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-600">Kelas</label>
                <select
                  value={selectedClass}
                  onChange={(e) => { setSelectedClass(e.target.value); setSelectedModule(""); }}
                  className="input-field text-sm"
                  id="select-class"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Module selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-600">Modul</label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="input-field text-sm"
                  disabled={!selectedClass}
                  id="select-module"
                >
                  <option value="">-- Pilih Modul --</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-600">Judul LKPD</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field text-sm"
                  placeholder="Contoh: LKPD - Kalkulus Integral"
                  id="lkpd-title"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-600">Deskripsi (opsional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field text-sm resize-none"
                  rows={2}
                  placeholder="Deskripsi singkat LKPD ini..."
                  id="lkpd-desc"
                />
              </div>

              {/* Deadline */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-600">Deadline (opsional)</label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="input-field text-sm"
                  id="lkpd-deadline"
                />
              </div>
            </div>

            {/* LaTeX hint */}
            <div className="card-flat rounded-2xl p-4 bg-amber-50 border-amber-200">
              <p className="text-xs font-bold text-amber-700 mb-2">💡 Tips LaTeX</p>
              <div className="space-y-1 text-xs text-amber-600 font-mono">
                <p>Inline: <code>$E = mc^2$</code></p>
                <p>Block: <code>$$\int_a^b f(x)dx$$</code></p>
                <p>Fraction: <code>$\frac{"{a}{b}"}$</code></p>
                <p>Sqrt: <code>$\sqrt{"{x}"}$</code></p>
              </div>
            </div>
          </div>

          {/* RIGHT: Instructions + Questions */}
          <div className="lg:col-span-2 space-y-4">
            {/* Instructions editor */}
            <div className="card-flat rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                <h3 className="font-bold text-neutral-900 text-sm flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary-600" />
                  Petunjuk & Materi LKPD (Markdown + LaTeX)
                </h3>
              </div>
              {previewMode ? (
                <div className="p-5 prose-evolva min-h-[200px]">
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
                  className="editor-area w-full rounded-none"
                  rows={12}
                  id="lkpd-instructions"
                  placeholder="Tulis petunjuk dalam Markdown + LaTeX..."
                />
              )}
            </div>

            {/* Questions */}
            <div className="card-flat rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                <h3 className="font-bold text-neutral-900 text-sm">
                  Daftar Soal ({questions.length} soal · {maxScore} poin total)
                </h3>
                <button
                  onClick={addQuestion}
                  className="btn-primary text-xs py-2 px-3"
                  id="add-question-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Soal
                </button>
              </div>
              <div className="divide-y divide-neutral-100">
                {questions.map((q, i) => (
                  <div key={q.id} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        <GripVertical className="w-4 h-4 text-neutral-300 cursor-grab" />
                        <span className="text-xs font-bold text-neutral-500 uppercase bg-neutral-100 px-2 py-0.5 rounded-full">
                          Soal {i + 1}
                        </span>
                        <select
                          value={q.question_type}
                          onChange={(e) => updateQuestion(q.id, "question_type", e.target.value)}
                          className="text-xs border border-neutral-200 rounded-lg px-2 py-1 text-neutral-600 focus:outline-none focus:border-primary-400"
                          id={`q-type-${q.id}`}
                        >
                          <option value="essay">Essay</option>
                          <option value="short_answer">Jawaban Singkat</option>
                          <option value="calculation">Perhitungan</option>
                        </select>
                        <input
                          type="number"
                          value={q.max_points}
                          onChange={(e) => updateQuestion(q.id, "max_points", Number(e.target.value))}
                          className="w-16 text-xs border border-neutral-200 rounded-lg px-2 py-1 text-center text-primary-600 font-bold focus:outline-none focus:border-primary-400"
                          min={1}
                          id={`q-points-${q.id}`}
                          title="Poin maksimal"
                        />
                        <span className="text-xs text-neutral-400">poin</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setExpandedQ((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                          className="btn-ghost p-1.5"
                        >
                          {expandedQ[q.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => removeQuestion(q.id)}
                          className="btn-ghost p-1.5 hover:text-red-500"
                          id={`remove-q-${q.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question text */}
                    {previewMode ? (
                      <div className="prose-evolva text-sm mb-2">
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
                        onChange={(e) => updateQuestion(q.id, "question_text", e.target.value)}
                        className="editor-area w-full text-sm"
                        rows={3}
                        placeholder="Tulis soal dengan Markdown + LaTeX..."
                        id={`q-text-${q.id}`}
                      />
                    )}

                    {/* Rubric hint — expanded */}
                    {expandedQ[q.id] && (
                      <div className="mt-3 space-y-1.5">
                        <label className="text-xs font-semibold text-neutral-500">
                          Rubrik / Petunjuk Penilaian (untuk AI)
                        </label>
                        <textarea
                          value={q.rubric_hint ?? ""}
                          onChange={(e) => updateQuestion(q.id, "rubric_hint", e.target.value)}
                          className="input-field text-xs resize-none"
                          rows={2}
                          placeholder="Contoh: Nilai penuh jika mahasiswa menyebutkan 3 komponen benar dan menunjukkan langkah kerja..."
                          id={`q-rubric-${q.id}`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Save button */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
                id="save-lkpd-bottom"
              >
                {saving ? (
                  <><div className="spinner !border-white/30 !border-t-white" /> Menyimpan...</>
                ) : (
                  <><Save className="w-4 h-4" /> Simpan LKPD</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
