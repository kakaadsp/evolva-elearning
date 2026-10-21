import type { Metadata } from "next";
import { Megaphone, Pin, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import TopNav from "@/components/layout/TopNav";

export const metadata: Metadata = { title: "Pengumuman Kelas" };

export default async function SiswaAnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: memberships } = await supabase
    .from("kelas_members")
    .select("kelas_id")
    .eq("user_id", user?.id ?? "")
    .eq("role", "siswa");
  const classIds = memberships?.map((item) => item.kelas_id) ?? [];
  const { data: announcements } = classIds.length
    ? await supabase
        .from("pengumuman")
        .select("id,title,content,is_pinned,created_at,kelas:kelas(name)")
        .in("kelas_id", classIds)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
    : { data: [] };

  return <div>
    <TopNav title="Pengumuman Kelas" breadcrumbs={[{ label: "Siswa", href: "/dashboard/siswa" }, { label: "Pengumuman" }]} />
    <div className="p-6 space-y-5">
      <div><h2 className="text-xl font-bold text-neutral-900">Pengumuman Terbaru</h2><p className="text-sm text-neutral-500 mt-1">Informasi dari dosen dan kelas yang kamu ikuti.</p></div>
      {announcements && announcements.length > 0 ? <div className="space-y-3">{announcements.map((announcement: any) => <article key={announcement.id} className="card-flat rounded-2xl p-5"><div className="flex items-start gap-4"><div className="w-11 h-11 rounded-xl bg-ai-50 flex items-center justify-center shrink-0"><Megaphone className="w-5 h-5 text-ai-600" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-neutral-900">{announcement.title}</h3>{announcement.is_pinned && <span className="badge badge-primary"><Pin className="w-3 h-3" />Disematkan</span>}</div><p className="text-xs text-primary-600 font-semibold mt-1">{Array.isArray(announcement.kelas) ? announcement.kelas[0]?.name : announcement.kelas?.name}</p><p className="text-sm text-neutral-600 mt-3 whitespace-pre-wrap leading-relaxed">{announcement.content}</p><p className="text-xs text-neutral-400 mt-4 flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{new Date(announcement.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</p></div></div></article>)}</div> : <div className="card-flat rounded-2xl py-16 text-center text-neutral-400"><Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="font-medium">Belum ada pengumuman</p><p className="text-sm mt-1">Pengumuman dosen akan muncul di sini.</p></div>}
    </div>
  </div>;
}
