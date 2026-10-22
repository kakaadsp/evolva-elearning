import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ classId: string }>;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type SupabaseAdminClient = Awaited<ReturnType<typeof createAdminClient>>;

async function verifyAccess(
  supabase: SupabaseServerClient,
  adminSupabase: SupabaseAdminClient,
  classId: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi telah berakhir. Silakan login kembali.", status: 401 };
  }

  // Check if admin
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") {
    return { user, isAdmin: true };
  }

  if (profile?.role === "guru") {
    // Check if guru owns or teaches the class
    const { data: kelas } = await adminSupabase
      .from("kelas")
      .select("created_by")
      .eq("id", classId)
      .single();

    if (kelas?.created_by === user.id) {
      return { user, isTeacher: true };
    }

    const { data: teacherMember } = await adminSupabase
      .from("kelas_members")
      .select("id")
      .eq("kelas_id", classId)
      .eq("user_id", user.id)
      .eq("role", "guru")
      .maybeSingle();

    if (teacherMember) {
      return { user, isTeacher: true };
    }
  }

  return { error: "Anda tidak memiliki izin mengelola siswa di kelas ini.", status: 403 };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { classId } = await params;
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    const authCheck = await verifyAccess(supabase, adminSupabase, classId);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    // Fetch all active students
    const { data: students, error: studentsError } = await adminSupabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .eq("role", "siswa")
      .eq("is_active", true)
      .order("full_name", { ascending: true });

    if (studentsError) {
      return NextResponse.json({ error: studentsError.message }, { status: 400 });
    }

    // Fetch existing enrolled student IDs
    const { data: enrolled, error: enrolledError } = await adminSupabase
      .from("kelas_members")
      .select("user_id")
      .eq("kelas_id", classId)
      .eq("role", "siswa");

    if (enrolledError) {
      return NextResponse.json({ error: enrolledError.message }, { status: 400 });
    }

    const enrolledIds = (enrolled || []).map((m: { user_id: string }) => m.user_id);

    return NextResponse.json({
      success: true,
      students: students || [],
      enrolledUserIds: enrolledIds,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { classId } = await params;
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    const authCheck = await verifyAccess(supabase, adminSupabase, classId);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const studentIds: string[] = Array.isArray(body?.studentIds) ? body.studentIds : [];

    // Get current student members
    const { data: currentMembers } = await adminSupabase
      .from("kelas_members")
      .select("user_id")
      .eq("kelas_id", classId)
      .eq("role", "siswa");

    const currentIds = new Set((currentMembers || []).map((m: { user_id: string }) => m.user_id));
    const newIds = new Set(studentIds);

    // Identify removals
    const toRemove = [...currentIds].filter((id) => !newIds.has(id));
    // Identify additions
    const toAdd = studentIds.filter((id) => !currentIds.has(id));

    if (toRemove.length > 0) {
      const { error: removeError } = await adminSupabase
        .from("kelas_members")
        .delete()
        .eq("kelas_id", classId)
        .eq("role", "siswa")
        .in("user_id", toRemove);

      if (removeError) throw removeError;
    }

    if (toAdd.length > 0) {
      const inserts = toAdd.map((userId) => ({
        kelas_id: classId,
        user_id: userId,
        role: "siswa",
      }));

      const { error: insertError } = await adminSupabase
        .from("kelas_members")
        .insert(inserts);

      if (insertError) throw insertError;
    }

    return NextResponse.json({
      success: true,
      count: studentIds.length,
      added: toAdd.length,
      removed: toRemove.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui siswa kelas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
