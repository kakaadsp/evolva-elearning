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

type Props = { searchParams: Promise<{ search?: string }> };

export default async function SiswaClassesPage({ searchParams }: Props) {
  const { search = "" } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ambil membership dan data kelas secara terpisah. Query relasi bertingkat
  // (kelas -> profiles) dapat mengembalikan `kelas: null` ketika PostgREST
  // tidak menemukan relasi FK yang tepat, walaupun membership-nya ada.
  const { data: memberships, error: membershipError } = await supabase
    .from("kelas_members")
    .select("kelas_id")
    .eq("user_id", user!.id)
    .eq("role", "siswa");

  const classIds = Array.from(
    new Set((memberships ?? []).map((membership) => membership.kelas_id).filter(Boolean))
  );

  const { data: classes, error: classesError } = classIds.length
    ? await supabase
        .from("kelas")
        .select("id, name, description, subject, semester, academic_year, created_by")
        .in("id", classIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  const teacherIds = Array.from(
    new Set((classes ?? []).map((kelas) => kelas.created_by).filter(Boolean))
  );
  const { data: teachers } = teacherIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", teacherIds)
    : { data: [] };
  const teacherById = new Map((teachers ?? []).map((teacher) => [teacher.id, teacher.full_name]));

  const loadError = membershipError || classesError;
  const normalizedSearch = search.trim().toLowerCase();
  const visibleClasses = (classes ?? []).filter((kelas) =>
    !normalizedSearch || [kelas.name, kelas.subject, kelas.description ?? ""].some((value) =>
      value.toLowerCase().includes(normalizedSearch)
    )
  );

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
        {loadError && (
          <div className="card-flat mb-5 border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            Kelas belum dapat dimuat. Silakan muat ulang halaman atau hubungi administrator.
          </div>
        )}
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-neutral-500">{visibleClasses.length} kelas ditemukan</p>
          {normalizedSearch && <Link href="/dashboard/siswa/classes" className="text-sm text-primary-600 font-semibold">Hapus pencarian</Link>}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleClasses.length > 0 ? (
            visibleClasses.map((kelas) => {
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

                  {teacherById.get(kelas.created_by) && (
                    <p className="text-xs text-neutral-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Dosen: {teacherById.get(kelas.created_by)}
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
                {normalizedSearch ? "Kelas tidak ditemukan" : "Kamu belum terdaftar di kelas manapun"}
              </p>
              <p className="text-sm text-neutral-400 mt-1">
                {normalizedSearch ? "Coba gunakan kata kunci lain." : "Hubungi administrator untuk mendaftarkanmu ke kelas."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
