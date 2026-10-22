import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET() {
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

    // Verify user role
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "guru" && profile.role !== "admin")) {
      return NextResponse.json(
        { error: "Hanya guru dan admin yang dapat melihat daftar siswa." },
        { status: 403 }
      );
    }

    // Fetch active students
    const { data: students, error: studentsError } = await adminSupabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .eq("role", "siswa")
      .eq("is_active", true)
      .order("full_name", { ascending: true });

    if (studentsError) {
      return NextResponse.json({ error: studentsError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      students: students || [],
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
