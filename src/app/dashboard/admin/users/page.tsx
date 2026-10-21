"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import TopNav from "@/components/layout/TopNav";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  UserCheck,
  UserX,
  Trash2,
  Edit3,
  X,
  Save,
  Users,
  Mail,
  Lock,
  User,
} from "lucide-react";
import type { Profile, UserRole } from "@/types";

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Administrator" },
  { value: "guru", label: "Guru / Dosen" },
  { value: "siswa", label: "Siswa / Mahasiswa" },
];

const roleBadge: Record<UserRole, string> = {
  admin: "badge-primary",
  guru: "badge-warning",
  siswa: "badge-ai",
};

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  guru: "Guru",
  siswa: "Siswa",
};

interface UserFormData {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    full_name: "",
    email: "",
    password: "",
    role: "siswa",
  });
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setUsers(data as Profile[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  async function toggleActive(user: Profile) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !user.is_active })
      .eq("id", user.id);

    if (error) {
      toast.error("Gagal mengubah status akun.");
    } else {
      toast.success(
        user.is_active
          ? `Akun ${user.full_name} dinonaktifkan.`
          : `Akun ${user.full_name} diaktifkan.`
      );
      fetchUsers();
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editUser) {
        // Update existing user
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: formData.full_name,
            role: formData.role,
          })
          .eq("id", editUser.id);

        if (error) throw error;
        toast.success("Data pengguna berhasil diperbarui.");
      } else {
        // Create new user via API
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Gagal membuat pengguna");
        toast.success(`Akun ${formData.full_name} berhasil dibuat!`);
      }

      setShowModal(false);
      setEditUser(null);
      setFormData({ full_name: "", email: "", password: "", role: "siswa" });
      fetchUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(user: Profile) {
    setEditUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setShowModal(true);
  }

  function openCreate() {
    setEditUser(null);
    setFormData({ full_name: "", email: "", password: "", role: "siswa" });
    setShowModal(true);
  }

  return (
    <div>
      <TopNav
        title="Pengelolaan Akun Pengguna"
        breadcrumbs={[
          { label: "Admin", href: "/dashboard/admin" },
          { label: "Pengguna" },
        ]}
      />

      <div className="p-6 space-y-5">
        {/* Header actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-3 flex-wrap">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field input-with-leading-icon w-full"
                id="search-users"
              />
            </div>
            {/* Role filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "all" | UserRole)}
              className="input-field w-40"
              id="filter-role"
            >
              <option value="all">Semua Peran</option>
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={openCreate}
            className="btn-primary"
            id="add-user-btn"
          >
            <Plus className="w-4 h-4" />
            Tambah Pengguna
          </button>
        </div>

        {/* Table */}
        <div className="card-flat rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Lengkap</th>
                  <th>Email</th>
                  <th>Peran</th>
                  <th>Status</th>
                  <th>Bergabung</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j}>
                          <div className="skeleton h-4 w-full max-w-[120px]" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0">
                            {u.full_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <span className="font-semibold text-neutral-900">{u.full_name}</span>
                        </div>
                      </td>
                      <td className="text-neutral-500">{u.email}</td>
                      <td>
                        <span className={`badge ${roleBadge[u.role]}`}>
                          {roleLabels[u.role]}
                        </span>
                      </td>
                      <td>
                        <label className="toggle cursor-pointer">
                          <input
                            type="checkbox"
                            checked={u.is_active}
                            onChange={() => toggleActive(u)}
                            id={`toggle-${u.id}`}
                          />
                          <span className="toggle-slider" />
                        </label>
                      </td>
                      <td className="text-neutral-400 text-xs">
                        {new Date(u.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(u)}
                            className="btn-ghost p-2"
                            id={`edit-user-${u.id}`}
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4 text-neutral-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-neutral-400">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Tidak ada pengguna ditemukan</p>
                      <p className="text-sm mt-1">Coba ubah filter atau tambah pengguna baru.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!loading && (
            <div className="px-5 py-3 border-t border-neutral-100 text-sm text-neutral-400">
              Menampilkan {filtered.length} dari {users.length} pengguna
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-neutral-900">
                  {editUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}
                </h3>
                <p className="text-sm text-neutral-400 mt-0.5">
                  {editUser ? "Perbarui informasi akun pengguna" : "Isi data untuk membuat akun baru"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="btn-ghost p-2"
                id="close-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Full name */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-neutral-700">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="input-field input-with-leading-icon"
                    placeholder="Nama lengkap pengguna"
                    id="input-fullname"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-neutral-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field input-with-leading-icon"
                    placeholder="email@institusi.ac.id"
                    disabled={!!editUser}
                    id="input-email"
                  />
                </div>
              </div>

              {/* Password (create only) */}
              {!editUser && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-neutral-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input-field input-with-leading-icon"
                      placeholder="Min. 8 karakter"
                      id="input-password"
                    />
                  </div>
                </div>
              )}

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-neutral-700">
                  Peran
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="input-field"
                  id="input-role"
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="btn-ghost flex-1 justify-center"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 justify-center"
                id="save-user-btn"
              >
                {saving ? (
                  <><div className="spinner !border-white/30 !border-t-white" /> Menyimpan...</>
                ) : (
                  <><Save className="w-4 h-4" /> {editUser ? "Simpan Perubahan" : "Buat Akun"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
