import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sesi telah berakhir. Silakan login kembali." },
        { status: 401 }
      );
    }

    const adminSupabase = await createAdminClient();

    // Verify user role is guru or admin
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "guru" && profile.role !== "admin")) {
      return NextResponse.json(
        { error: "Hanya guru dan admin yang dapat mengakses halaman koreksi." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const lkpdId = searchParams.get("lkpdId");

    let query = adminSupabase
      .from("lkpd_submissions")
      .select(`
        *,
        student:profiles!lkpd_submissions_student_id_fkey(full_name, email),
        lkpd:lkpd!lkpd_submissions_lkpd_id_fkey(title, questions, max_score)
      `)
      .order("submitted_at", { ascending: false });

    if (lkpdId) {
      query = query.eq("lkpd_id", lkpdId);
    }

    const { data: submissions, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Ensure student profile is always an object with fallback
    const safeSubmissions = (submissions || []).map((sub) => ({
      ...sub,
      student: sub.student || {
        full_name: "Mahasiswa",
        email: "",
      },
    }));

    return NextResponse.json({ success: true, submissions: safeSubmissions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sesi telah berakhir. Silakan login kembali." },
        { status: 401 }
      );
    }

    const adminSupabase = await createAdminClient();

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "guru" && profile.role !== "admin")) {
      return NextResponse.json(
        { error: "Hanya guru dan admin yang dapat memvalidasi nilai." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { submission_id, final_score, teacher_notes } = body;

    if (!submission_id) {
      return NextResponse.json({ error: "ID pengumpulan wajib disertakan." }, { status: 400 });
    }

    const { data: updated, error } = await adminSupabase
      .from("lkpd_submissions")
      .update({
        status: "validated",
        final_score: Number(final_score),
        teacher_notes: teacher_notes || null,
        validated_by: user.id,
        validated_at: new Date().toISOString(),
      })
      .eq("id", submission_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, submission: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan validasi nilai.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
