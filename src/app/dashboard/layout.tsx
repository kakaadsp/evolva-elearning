import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role || "siswa") as "admin" | "guru" | "siswa";

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role={role}
        userName={profile?.full_name || user.email || "Pengguna"}
        userEmail={profile?.email || user.email || ""}
      />
      <div className="main-content flex-1">{children}</div>
    </div>
  );
}
