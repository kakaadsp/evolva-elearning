"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import {
  Sparkles,
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  ClipboardCheck,
  BarChart3,
  Megaphone,
  GraduationCap,
  Shield,
  LogOut,
  ChevronRight,
  BookMarked,
  Award,
} from "lucide-react";
import type { UserRole } from "@/types";

interface SidebarProps {
  role: UserRole;
  userName: string;
  userEmail: string;
}

const adminMenu = [
  { href: "/dashboard/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/admin/users", icon: Users, label: "Pengelolaan Akun" },
  { href: "/dashboard/admin/classes", icon: BookOpen, label: "Pengelolaan Kelas" },
];

const guruMenu = [
  { href: "/dashboard/guru", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/guru/classes", icon: BookOpen, label: "Kelas Saya" },
  { href: "/dashboard/guru/materials", icon: FileText, label: "Materi" },
  { href: "/dashboard/guru/lkpd", icon: ClipboardCheck, label: "LKPD" },
  { href: "/dashboard/guru/grading", icon: Award, label: "Koreksi AI" },
  { href: "/dashboard/guru/analytics", icon: BarChart3, label: "Analitik" },
  { href: "/dashboard/guru/announcements", icon: Megaphone, label: "Pengumuman" },
];

const siswaMenu = [
  { href: "/dashboard/siswa", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/siswa/classes", icon: GraduationCap, label: "Kelas Saya" },
  { href: "/dashboard/siswa/lkpd", icon: ClipboardCheck, label: "LKPD Saya" },
  { href: "/dashboard/siswa/grades", icon: Award, label: "Nilai & Feedback" },
  { href: "/dashboard/siswa/announcements", icon: Megaphone, label: "Pengumuman" },
];

const roleConfig = {
  admin: {
    label: "Administrator",
    color: "from-violet-500 to-purple-600",
    textColor: "text-violet-600",
    bgColor: "bg-violet-50",
    icon: Shield,
    menu: adminMenu,
  },
  guru: {
    label: "Guru / Dosen",
    color: "from-indigo-500 to-primary-600",
    textColor: "text-primary-600",
    bgColor: "bg-primary-50",
    icon: BookMarked,
    menu: guruMenu,
  },
  siswa: {
    label: "Siswa / Mahasiswa",
    color: "from-teal-500 to-ai-600",
    textColor: "text-ai-600",
    bgColor: "bg-ai-50",
    icon: GraduationCap,
    menu: siswaMenu,
  },
};

export default function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const config = roleConfig[role];
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Berhasil keluar dari platform.");
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === `/dashboard/${role}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <aside className="sidebar overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-6">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-sm shrink-0`}>
          <Sparkles className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <p className="font-extrabold text-neutral-900 text-sm leading-none">Evolva</p>
          <p className="text-xs text-neutral-400 leading-none mt-0.5">E-Learning FMIPA</p>
        </div>
      </div>

      {/* Role badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${config.bgColor} mb-4`}>
        <config.icon className={`w-4 h-4 ${config.textColor}`} />
        <span className={`text-xs font-semibold ${config.textColor}`}>{config.label}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5">
        {config.menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            id={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            className={`sidebar-item ${isActive(item.href) ? "active" : ""}`}
          >
            <item.icon className="w-4.5 h-4.5 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {isActive(item.href) && (
              <ChevronRight className="w-3 h-3 opacity-50" />
            )}
          </Link>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="mt-auto pt-4 border-t border-neutral-200">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
            {userName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900 truncate">{userName}</p>
            <p className="text-xs text-neutral-400 truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-red-500 hover:bg-red-50 hover:text-red-600"
          id="logout-btn"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
