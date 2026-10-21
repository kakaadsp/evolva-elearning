/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import TopNav from "@/components/layout/TopNav";
import Link from "next/link";
import {
  ClipboardCheck,
  Clock,
  CheckCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
} from "lucide-react";

export const metadata: Metadata = { title: "LKPD Saya" };

export default async function SiswaLKPDPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: enrollments } = await supabase
    .from("kelas_members")
    .select("kelas_id")
    .eq("user_id", user!.id)
    .eq("role", "siswa");

  const kelasIds = enrollments?.map((e) => e.kelas_id) || [];

  interface LkpdItem {
    id: string;
    title: string;
    description?: string;
    max_score: number;
    deadline?: string;
    modul: { title: string; kelas: { name: string } | null } | null;
    submission: { status: string; ai_score?: number | null; final_score?: number | null } | null;
  }

  let lkpdList: LkpdItem[] = [];

  if (kelasIds.length > 0) {
    const { data: moduls } = await supabase
      .from("modul_pembelajaran")
      .select("id")
      .in("kelas_id", kelasIds);

    const modulIds = moduls?.map((m) => m.id) || [];

    if (modulIds.length > 0) {
      const { data } = await supabase
        .from("lkpd")
        .select(
          `id, title, description, max_score, deadline, modul_id,
           modul:modul_pembelajaran!lkpd_modul_id_fkey(
             title, kelas:kelas!modul_pembelajaran_kelas_id_fkey(name)
           )`
        )
        .in("modul_id", modulIds)
        .eq("is_available", true)
        .order("created_at", { ascending: false });

      if (data) {
        const lkpdIds = data.map((l: any) => l.id);
        const { data: submissions } = await supabase
          .from("lkpd_submissions")
          .select("lkpd_id, status, ai_score, final_score")
          .eq("student_id", user!.id)
          .in("lkpd_id", lkpdIds);

        const subMap = new Map(submissions?.map((s) => [s.lkpd_id, s]) || []);

        lkpdList = (data as any[]).map((l) => {
          const modul = Array.isArray(l.modul) ? l.modul[0] : l.modul;
          const kelas = modul ? (Array.isArray(modul.kelas) ? modul.kelas[0] : modul.kelas) : null;
          return {
            id: l.id,
            title: l.title,
            description: l.description,
            max_score: l.max_score,
            deadline: l.deadline,
            modul: modul ? { title: modul.title, kelas } : null,
            submission: (subMap.get(l.id) as LkpdItem["submission"]) || null,
          };
        });
      }
    }
  }

  const statusInfo: Record<string, { label: string; icon: any; class: string }> = {
    submitted: { label: "Menunggu Koreksi", icon: Clock, class: "badge-warning" },
    ai_grading: { label: "AI Mengoreksi...", icon: Sparkles, class: "badge-ai" },
    ai_graded: { label: "Selesai AI", icon: Sparkles, class: "badge-ai" },
    validated: { label: "Nilai Final", icon: CheckCircle, class: "badge-success" },
  };

  return (
    <div>
      <TopNav
        title="LKPD Saya"
        breadcrumbs={[
          { label: "Siswa", href: "/dashboard/siswa" },
          { label: "LKPD" },
        ]}
      />
      <div className="p-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lkpdList.length > 0 ? (
            lkpdList.map((l) => {
              const sub = l.submission;
              const isSubmitted = !!sub;
              const info = sub ? statusInfo[sub.status] : null;

              return (
                <div key={l.id} className="card p-5 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                      <ClipboardCheck className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-neutral-900 text-sm truncate">{l.title}</h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {l.modul?.kelas?.name}
                      </p>
                    </div>
                    {info && (
                      <span className={`badge text-xs ${info.class} shrink-0`}>
                        <info.icon className="w-3 h-3" />
                        {info.label}
                      </span>
                    )}
                  </div>

                  {l.description && (
                    <p className="text-xs text-neutral-500 line-clamp-2">{l.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-neutral-400">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {l.modul?.title}
                    </span>
                    <span>·</span>
                    <span>Maks. {l.max_score} poin</span>
                  </div>

                  {l.deadline && (
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <Clock className="w-3 h-3" />
                      Deadline:{" "}
                      {new Date(l.deadline).toLocaleString("id-ID", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </div>
                  )}

                  {sub && (sub.ai_score != null || sub.final_score != null) && (
                    <div className="flex gap-2">
                      {sub.ai_score != null && (
                        <span className="badge badge-ai text-xs">
                          <Sparkles className="w-3 h-3" /> AI: {sub.ai_score}
                        </span>
                      )}
                      {sub.final_score != null && (
                        <span className="badge badge-success text-xs">
                          ✓ Final: {sub.final_score}
                        </span>
                      )}
                    </div>
                  )}

                  <Link
                    href={`/dashboard/siswa/lkpd/${l.id}`}
                    className={`justify-center text-sm mt-auto ${
                      isSubmitted ? "btn-secondary" : "btn-primary"
                    }`}
                    id={`lkpd-${l.id}`}
                  >
                    {isSubmitted ? (
                      <>Lihat Jawaban <ArrowRight className="w-4 h-4" /></>
                    ) : (
                      <>Kerjakan <ArrowRight className="w-4 h-4" /></>
                    )}
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20 text-neutral-400">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-neutral-600">Belum ada LKPD tersedia</p>
              <p className="text-sm mt-1">LKPD akan muncul saat dosen mengaktifkannya.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
