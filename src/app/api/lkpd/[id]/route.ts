import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function verifyAccess(lkpdId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi telah berakhir. Silakan login kembali.", status: 401 };
  }

  const adminSupabase = await createAdminClient();

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") {
    return { user, adminSupabase, isAdmin: true };
  }

  if (profile?.role === "guru") {
    const { data: lkpd } = await adminSupabase
      .from("lkpd")
      .select("id, created_by")
      .eq("id", lkpdId)
      .single();

    if (!lkpd) {
      return { error: "LKPD tidak ditemukan.", status: 404 };
    }

    if (lkpd.created_by === user.id) {
      return { user, adminSupabase, isOwner: true };
    }
  }

  return { error: "Anda tidak memiliki izin mengelola LKPD ini.", status: 403 };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const access = await verifyAccess(id);
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { data: lkpd, error } = await access.adminSupabase!
      .from("lkpd")
      .select(`
        id,
        title,
        description,
        instructions,
        questions,
        max_score,
        deadline,
        is_available,
        created_at,
        updated_at,
        modul_id,
        modul_pembelajaran (
          id,
          title,
          kelas_id,
          kelas (
            id,
            name
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error || !lkpd) {
      return NextResponse.json({ error: "LKPD tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ success: true, lkpd });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const access = await verifyAccess(id);
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await request.json();
    const {
      title,
      description,
      instructions,
      questions,
      max_score,
      deadline,
      is_available,
      modul_id,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Judul LKPD wajib diisi." }, { status: 400 });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "Minimal harus ada 1 soal." }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {
      title: title.trim(),
      description: description?.trim() || null,
      instructions: instructions?.trim() ?? "",
      questions,
      max_score: Number(max_score) || 100,
      deadline: deadline || null,
      updated_at: new Date().toISOString(),
    };

    if (typeof is_available === "boolean") {
      updatePayload.is_available = is_available;
    }

    if (modul_id) {
      updatePayload.modul_id = modul_id;
    }

    const { data: updated, error } = await access.adminSupabase!
      .from("lkpd")
      .update(updatePayload)
      .eq("id", id)
      .select("id, title, max_score, is_available, updated_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, lkpd: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui LKPD.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const access = await verifyAccess(id);
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { error } = await access.adminSupabase!
      .from("lkpd")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus LKPD.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
