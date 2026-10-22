import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Calendar,
  Award,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import TopNav from "@/components/layout/TopNav";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";

export const metadata: Metadata = { title: "Detail Kelas" };

type Props = { params: Promise<{ classId: string }> };

export default async function SiswaClassDetailPage({ params }: Props) {
  const { classId } = await params;
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Verify student membership in this class
  const { data: membership } = await supabase
    .from("kelas_members")
    .select("id")
    .eq("kelas_id", classId)
    .eq("user_id", user.id)
    .eq("role", "siswa")
    .maybeSingle();

  if (!membership) {
    return (
      <div>
        <TopNav
          title="Kelas"
          breadcrumbs={[
            { label: "Siswa", href: "/dashboard/siswa" },
            { label: "Kelas" },
          ]}
        />
        <div className="p-6">
          <div className="card-flat rounded-2xl p-10 text-center">
            <h2 className="text-xl font-bold text-neutral-900">
              Kelas tidak ditemukan
            </h2>
            <p className="text-sm text-neutral-500 mt-2">
              Kamu belum terdaftar sebagai siswa di kelas ini.
            </p>
            <Link
              href="/dashboard/siswa/classes"
              className="btn-primary inline-flex mt-5 text-xs py-2 px-4"
            >
              Kembali ke Kelas Saya
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Fetch class data
  const { data: kelas } = await adminSupabase
    .from("kelas")
    .select("id, name, description, subject, semester, academic_year, created_by")
    .eq("id", classId)
    .maybeSingle();

  // 3. Fetch modules for this class
  const { data: modules } = await adminSupabase
    .from("modul_pembelajaran")
    .select("id, title, description, order_index")
    .eq("kelas_id", classId)
    .eq("is_available", true)
    .order("order_index", { ascending: true });

  const moduleIds = (modules ?? []).map((m) => m.id);

  // 4. Fetch materials for these modules (Note: materi table does not have 'description' column)
  const { data: materials } = moduleIds.length
    ? await adminSupabase
        .from("materi")
        .select("id, modul_id, title, content, content_type, file_url, order_index")
        .in("modul_id", moduleIds)
        .eq("is_available", true)
        .order("order_index", { ascending: true })
    : { data: [] };

  // 5. Fetch LKPD for these modules
  const { data: lkpds } = moduleIds.length
    ? await adminSupabase
        .from("lkpd")
        .select("id, modul_id, title, description, max_score, deadline, is_available, order_index")
        .in("modul_id", moduleIds)
        .eq("is_available", true)
        .order("order_index", { ascending: true })
    : { data: [] };

  return (
    <div>
      <TopNav
        title={kelas?.name ?? "Kelas"}
        breadcrumbs={[
          { label: "Siswa", href: "/dashboard/siswa" },
          { label: "Kelas Saya", href: "/dashboard/siswa/classes" },
          { label: kelas?.name ?? "Detail" },
        ]}
      />

      <div className="p-6 space-y-6">
        <Link
          href="/dashboard/siswa/classes"
          className="inline-flex items-center gap-2 text-xs font-semibold text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Kelas Saya
        </Link>

        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-teal-500 to-ai-600 text-white shadow-md">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-white/80 text-xs font-medium">
              <GraduationCap className="w-4 h-4" />
              Kelas Aktif
            </div>
            <h1 className="text-2xl font-extrabold mt-2">
              {kelas?.name ?? "Kelas"}
            </h1>
            <p className="text-white/80 mt-1 text-xs">
              {kelas?.subject} · Semester {kelas?.semester} · {kelas?.academic_year}
            </p>
            {kelas?.description && (
              <p className="text-white/70 text-xs mt-3 max-w-2xl leading-relaxed">
                {kelas.description}
              </p>
            )}
          </div>
        </div>

        {/* Learning Modules */}
        <div className="space-y-6">
          {(modules ?? []).length ? (
            (modules ?? []).map((module) => {
              const moduleMaterials = (materials ?? []).filter(
                (item) => item.modul_id === module.id
              );
              const moduleLkpds = (lkpds ?? []).filter(
                (item) => item.modul_id === module.id
              );

              return (
                <section
                  key={module.id}
                  className="card-flat rounded-2xl overflow-hidden border border-neutral-200/80 shadow-xs"
                >
                  {/* Module Header */}
                  <div className="p-5 border-b border-neutral-100 bg-neutral-50/50 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-extrabold text-base text-neutral-900 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary-600" />
                        Modul: {module.title}
                      </h2>
                      {module.description && (
                        <p className="text-xs text-neutral-500 mt-1">
                          {module.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="badge bg-primary-50 text-primary-700 font-semibold border-primary-200">
                        {moduleMaterials.length} Materi
                      </span>
                      <span className="badge bg-ai-50 text-ai-700 font-semibold border-ai-200">
                        {moduleLkpds.length} LKPD
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Materials Section */}
                    {moduleMaterials.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                          Materi Pembelajaran
                        </h3>

                        {moduleMaterials.map((item) => (
                          <details
                            key={item.id}
                            className="rounded-xl border border-neutral-200 bg-white p-4 group transition-all"
                            open
                          >
                            <summary className="flex items-center justify-between cursor-pointer list-none select-none">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 text-primary-600">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-sm text-neutral-900 truncate">
                                    {item.title}
                                  </p>
                                  <p className="text-[11px] text-neutral-400">
                                    Teks Pembelajaran (Markdown & LaTeX)
                                  </p>
                                </div>
                              </div>

                              <span className="text-xs text-primary-600 font-semibold flex items-center gap-1 group-open:rotate-180 transition-transform">
                                <ChevronDown className="w-4 h-4" />
                              </span>
                            </summary>

                            {/* Formatted Markdown with KaTeX rendering */}
                            <div className="mt-4 pt-4 border-t border-neutral-100 prose-evolva text-xs leading-relaxed max-w-none text-neutral-800">
                              <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex, rehypeRaw]}
                              >
                                {item.content || "Materi belum memiliki isi."}
                              </ReactMarkdown>
                            </div>
                          </details>
                        ))}
                      </div>
                    )}

                    {/* LKPD Section */}
                    {moduleLkpds.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                          Lembar Kerja Peserta Didik (LKPD)
                        </h3>

                        <div className="grid sm:grid-cols-2 gap-3">
                          {moduleLkpds.map((lkpd) => (
                            <Link
                              key={lkpd.id}
                              href={`/dashboard/siswa/lkpd/${lkpd.id}`}
                              className="rounded-xl border border-ai-200 bg-ai-50/40 p-4 flex flex-col justify-between gap-3 hover:bg-ai-50 hover:shadow-xs transition-all group"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <div className="w-8 h-8 rounded-lg bg-ai-100 flex items-center justify-center text-ai-700">
                                    <ClipboardCheck className="w-4 h-4" />
                                  </div>
                                  <span className="badge badge-success text-[10px]">
                                    Tersedia
                                  </span>
                                </div>

                                <p className="font-bold text-xs text-neutral-900 group-hover:text-ai-800 transition-colors">
                                  {lkpd.title}
                                </p>

                                {lkpd.description && (
                                  <p className="text-[11px] text-neutral-500 line-clamp-2">
                                    {lkpd.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-ai-100 text-[11px] text-neutral-500">
                                <span className="flex items-center gap-1 font-semibold text-ai-700">
                                  <Award className="w-3.5 h-3.5" />
                                  Maks. {lkpd.max_score} poin
                                </span>

                                {lkpd.deadline && (
                                  <span className="flex items-center gap-1 text-neutral-400">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(lkpd.deadline).toLocaleDateString(
                                      "id-ID",
                                      {
                                        day: "numeric",
                                        month: "short",
                                      }
                                    )}
                                  </span>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty content state */}
                    {!moduleMaterials.length && !moduleLkpds.length && (
                      <div className="py-8 text-center text-neutral-400">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs font-semibold">
                          Belum ada materi atau LKPD yang dipublikasikan dalam modul ini.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              );
            })
          ) : (
            <div className="card-flat rounded-2xl p-12 text-center border border-neutral-200/80">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-neutral-300 opacity-40" />
              <p className="font-bold text-neutral-700">
                Belum ada modul pembelajaran
              </p>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                Materi dan LKPD akan otomatis muncul setelah dosen mempublikasikan modul pembelajaran.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
