"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ArrowLeft,
  Brain,
  BookOpen,
  Users,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(
          error.message === "Invalid login credentials"
            ? "Email atau password salah. Silakan coba lagi."
            : error.message
        );
        return;
      }

      if (data.user) {
        // Fetch role from profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name, is_active")
          .eq("id", data.user.id)
          .single();

        if (!profile?.is_active) {
          await supabase.auth.signOut();
          toast.error("Akun kamu tidak aktif. Hubungi administrator.");
          return;
        }

        toast.success(`Selamat datang, ${profile?.full_name || "pengguna"}! 👋`);

        const role = profile?.role || "siswa";
        router.push(`/dashboard/${role}`);
        router.refresh();
      }
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const demoAccounts = [
    { role: "Admin", email: "admin@evolva.id", color: "text-violet-600 bg-violet-50", icon: Users },
    { role: "Guru", email: "guru@evolva.id", color: "text-primary-600 bg-primary-50", icon: BookOpen },
    { role: "Siswa", email: "siswa@evolva.id", color: "text-ai-600 bg-ai-50", icon: Brain },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 hero-bg" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        
        {/* Floating shapes */}
        <div className="absolute top-20 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-20 right-10 w-56 h-56 bg-teal-300/20 rounded-full blur-3xl animate-float delay-300" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-xl leading-none">Evolva</p>
              <p className="text-white/60 text-xs leading-none mt-0.5">E-Learning FMIPA</p>
            </div>
          </div>

          {/* Center content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl font-extrabold leading-tight mb-4">
                Belajar Lebih Cerdas<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-teal-200">
                  Bersama AI
                </span>
              </h2>
              <p className="text-white/70 text-base leading-relaxed max-w-sm">
                Platform e-learning konstruktivis dengan koreksi LKPD otomatis menggunakan Groq AI — 
                cepat, akurat, dan mendidik.
              </p>
            </div>

            {/* Feature bullets */}
            <div className="space-y-3">
              {[
                { icon: "⚡", text: "Koreksi AI dalam <500ms dengan Groq" },
                { icon: "📐", text: "Dukungan LaTeX & Markdown untuk FMIPA" },
                { icon: "📊", text: "Analitik progres belajar real-time" },
                { icon: "🔒", text: "Keamanan RBAC bertingkat" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-white/80 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <p className="text-white/40 text-xs">
            © 2025 Evolva E-Learning · Powered by Groq AI
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-neutral-50">
        <div className="w-full max-w-md">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-primary-600 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-hero-gradient flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-neutral-900">Evolva E-Learning</span>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-neutral-900 mb-2">
              Selamat Datang! 👋
            </h1>
            <p className="text-neutral-500">
              Masuk ke akun Evolva E-Learning kamu
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-semibold text-neutral-700"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field input-with-leading-icon"
                  placeholder="nama@institusi.ac.id"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-neutral-700"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field input-with-leading-icon input-with-trailing-icon"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2"
              id="login-submit"
            >
              {loading ? (
                <>
                  <div className="spinner !border-white/30 !border-t-white" />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Masuk ke Platform
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-neutral-200" />
              <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">
                Akun Demo
              </span>
              <div className="flex-1 h-px bg-neutral-200" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword("demo123456");
                    toast("Kredensial demo diisi otomatis! 🎉", { icon: "✨" });
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${acc.color} border border-current/10 hover:scale-105 transition-transform cursor-pointer`}
                  id={`demo-${acc.role.toLowerCase()}`}
                >
                  <acc.icon className="w-4 h-4" />
                  <span className="text-xs font-semibold">{acc.role}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-400 text-center mt-2">
              Password demo: <code className="font-mono bg-neutral-100 px-1 rounded">demo123456</code>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-neutral-400 mt-8">
            Belum punya akun? Hubungi administrator institusimu.
          </p>
        </div>
      </div>
    </div>
  );
}
