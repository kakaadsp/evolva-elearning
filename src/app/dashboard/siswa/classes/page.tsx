/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import TopNav from "@/components/layout/TopNav";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  ArrowRight,
  Users,
  Clock,
} from "lucide-react";

export const metadata: Metadata = { title: "Kelas Saya" };

export default async function SiswaClassesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: enrollments } = await supabase
    .from("kelas_members")
    .select(
      `kelas:kelas!kelas_members_kelas_id_fkey(
        id, name, description, subject, semester, academic_year,
        guru:profiles!kelas_created_by_fkey(full_name)
      )`
    )
    .eq("user_id", user!.id)
    .eq("role", "siswa");

  return (
    <div>
      <TopNav
        title="Kelas Saya"
        breadcrumbs={[
          { label: "Siswa", href: "/dashboard/siswa" },
          { label: "Kelas" },
        ]}
      />
      <div className="p-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {enrollments && enrollments.length > 0 ? (
            (enrollments as any[]).map((e) => {
              const kelas = Array.isArray(e.kelas) ? e.kelas[0] : e.kelas;
              if (!kelas) return null;
              const guru = Array.isArray(kelas.guru) ? kelas.guru[0] : kelas.guru;
              return (
                <div key={kelas.id} className="card p-5 flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-ai-600 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-neutral-900 truncate">{kelas.name}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">{kelas.subject}</p>
                    </div>
                  </div>

                  {kelas.description && (
                    <p className="text-sm text-neutral-500 line-clamp-2">{kelas.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Sem. {kelas.semester} · {kelas.academic_year}
                    </span>
                  </div>

                  {guru && (
                    <p className="text-xs text-neutral-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Dosen: {guru.full_name}
                    </p>
                  )}

                  <Link
                    href={`/dashboard/siswa/classes/${kelas.id}`}
                    className="btn-primary justify-center text-sm"
                    id={`enter-class-${kelas.id}`}
                  >
                    Masuk Kelas
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20">
              <BookOpen className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
              <p className="font-bold text-neutral-600">
                Kamu belum terdaftar di kelas manapun
              </p>
              <p className="text-sm text-neutral-400 mt-1">
                Hubungi administrator untuk mendaftarkanmu ke kelas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
