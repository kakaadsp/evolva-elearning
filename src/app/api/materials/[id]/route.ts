import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function verifyAccess(materialId: string) {
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
    // Check if guru created the material
    const { data: material } = await adminSupabase
      .from("materi")
      .select("id, created_by, modul_id")
      .eq("id", materialId)
      .single();

    if (!material) {
      return { error: "Materi tidak ditemukan.", status: 404 };
    }

    if (material.created_by === user.id) {
      return { user, adminSupabase, isOwner: true };
    }
  }

  return { error: "Anda tidak memiliki izin mengedit materi ini.", status: 403 };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const access = await verifyAccess(id);
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { data: material, error } = await access.adminSupabase!
      .from("materi")
      .select(`
        id,
        title,
        content,
        content_type,
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
            name,
            subject
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error || !material) {
      return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ success: true, material });
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
    const { title, content, is_available, modul_id } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Judul materi wajib diisi." }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Isi materi wajib diisi." }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {
      title: title.trim(),
      content: content.trim(),
      updated_at: new Date().toISOString(),
    };

    if (typeof is_available === "boolean") {
      updatePayload.is_available = is_available;
    }

    if (modul_id) {
      updatePayload.modul_id = modul_id;
    }

    const { data: updated, error } = await access.adminSupabase!
      .from("materi")
      .update(updatePayload)
      .eq("id", id)
      .select("id, title, is_available, updated_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, material: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui materi.";
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
      .from("materi")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus materi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
