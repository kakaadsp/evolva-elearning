"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  Brain,
  Users,
  CheckCircle,
  ChevronRight,
  Sparkles,
  GraduationCap,
  BarChart3,
  Shield,
  Zap,
  Star,
  ArrowRight,
  Play,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Materi Interaktif",
    desc: "Konten Markdown + LaTeX untuk rumus matematika dan sains yang presisi tinggi.",
    color: "text-primary-600",
    bg: "bg-primary-50",
  },
  {
    icon: Brain,
    title: "Koreksi AI Groq",
    desc: "LKPD dikoreksi otomatis oleh Llama 3.3 70B dengan latensi ultra-rendah.",
    color: "text-ai-600",
    bg: "bg-ai-50",
  },
  {
    icon: Users,
    title: "Manajemen Kelas",
    desc: "Admin dapat mengelola kelas, anggota, dan hak akses secara real-time.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: CheckCircle,
    title: "Validasi Guru",
    desc: "Dashboard side-by-side untuk guru memvalidasi skor AI menjadi nilai akhir.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: BarChart3,
    title: "Analitik Progres",
    desc: "Pantau kemajuan belajar setiap mahasiswa dengan grafik interaktif.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Shield,
    title: "RBAC Security",
    desc: "Middleware keamanan Next.js yang memisahkan akses Admin, Guru, dan Siswa.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
];

const stats = [
  { value: "99%", label: "Uptime Platform", icon: Zap },
  { value: "<500ms", label: "Koreksi AI Groq", icon: Brain },
  { value: "3", label: "Peran Pengguna", icon: Users },
  { value: "∞", label: "Batas Kelas", icon: BookOpen },
];

const roles = [
  {
    icon: Shield,
    role: "Admin",
    desc: "Kelola semua akun, kelas, dan hak akses platform",
    features: ["CRUD Pengguna", "Manajemen Kelas", "Pengaturan RBAC", "Monitor Sistem"],
    color: "from-violet-500 to-purple-600",
    href: "/login",
  },
  {
    icon: GraduationCap,
    role: "Guru / Dosen",
    desc: "Buat materi, LKPD interaktif, dan validasi koreksi AI",
    features: ["Editor Materi", "Buat LKPD LaTeX", "Koreksi AI Otomatis", "Analitik Kelas"],
    color: "from-indigo-500 to-primary-600",
    href: "/login",
  },
  {
    icon: BookOpen,
    role: "Siswa / Mahasiswa",
    desc: "Akses materi, kerjakan LKPD, dan ikuti evaluasi",
    features: ["Akses Materi", "Kerjakan LKPD", "Ikuti Kuis/Ujian", "Lihat Nilai AI"],
    color: "from-teal-500 to-ai-600",
    href: "/login",
  },
];

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState(0);

  return (
    <main className="min-h-screen bg-neutral-50 overflow-x-hidden">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-hero-gradient flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-neutral-900 text-sm leading-none">Evolva</p>
              <p className="text-xs text-neutral-500 leading-none">E-Learning</p>
            </div>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#fitur" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors font-medium">Fitur</a>
            <a href="#peran" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors font-medium">Peran</a>
            <a href="#teknologi" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors font-medium">Teknologi</a>
          </div>

          {/* CTA */}
          <Link href="/login" className="btn-primary text-sm py-2 px-5">
            Masuk ke Platform
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 hero-bg opacity-95" />
        
        {/* Decorative blobs */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-teal-300/20 rounded-full blur-3xl animate-float delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center py-32">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 text-white rounded-full px-4 py-2 text-sm font-medium mb-8 border border-white/20 animate-fade-in">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            Powered by Groq AI · Llama 3.3 70B
            <Star className="w-4 h-4 text-yellow-300" />
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6 animate-slide-up">
            Evolva
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-teal-200">
              E-Learning
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-4 animate-slide-up delay-100">
            Platform Pembelajaran Konstruktivis untuk
            <strong className="text-white"> Fakultas MIPA</strong>
          </p>

          <p className="text-base text-white/60 max-w-2xl mx-auto mb-10 animate-slide-up delay-200">
            Integrasikan kecerdasan buatan dalam proses belajar. Koreksi LKPD otomatis, 
            analitik progres real-time, dan navigasi sekuensial yang membangun pemahaman bertahap.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up delay-300">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white text-primary-600 font-bold text-base px-8 py-4 rounded-2xl hover:bg-white/90 transition-all hover:shadow-xl hover:-translate-y-1 duration-200"
            >
              Mulai Belajar Sekarang
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#fitur"
              className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold text-base px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/20 transition-all hover:-translate-y-1 duration-200"
            >
              <Play className="w-5 h-5" />
              Lihat Fitur
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 animate-slide-up delay-400">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 text-center">
                <s.icon className="w-5 h-5 text-white/70 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/60 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 80" className="w-full fill-neutral-50">
            <path d="M0,40 C300,80 900,0 1200,40 L1200,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="fitur" className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="inline-block badge badge-primary mb-4 text-sm px-4 py-1.5">
              ✦ Fitur Unggulan
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-neutral-900 mb-4">
              Semua yang Kamu Butuhkan,{" "}
              <span className="gradient-text">dalam Satu Platform</span>
            </h2>
            <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
              Dirancang khusus untuk pembelajaran konstruktivis FMIPA dengan dukungan rumus LaTeX dan koreksi AI real-time.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="card p-6 group cursor-default"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-base font-bold text-neutral-900 mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ROLES ===== */}
      <section id="peran" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block badge badge-ai mb-4 text-sm px-4 py-1.5">
              ✦ Peran Pengguna
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-neutral-900 mb-4">
              Platform untuk <span className="gradient-text">Semua Peran</span>
            </h2>
          </div>

          {/* Role tabs */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Tab selector */}
            <div className="flex lg:flex-col gap-3 lg:w-64 shrink-0">
              {roles.map((r, i) => (
                <button
                  key={r.role}
                  onClick={() => setActiveRole(i)}
                  className={`flex items-center gap-3 p-4 rounded-2xl text-left transition-all duration-200 ${
                    activeRole === i
                      ? "bg-gradient-to-r " + r.color + " text-white shadow-lg scale-105"
                      : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <r.icon className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">{r.role}</p>
                    <p className={`text-xs mt-0.5 ${activeRole === i ? "text-white/70" : "text-neutral-400"}`}>
                      {r.features.length} fitur
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Role detail */}
            <div className="flex-1 card p-8 bg-gradient-to-br from-neutral-50 to-white animate-fade-in" key={activeRole}>
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${roles[activeRole].color} flex items-center justify-center mb-6 shadow-lg`}>
                {(() => {
                  const Icon = roles[activeRole].icon;
                  return <Icon className="w-8 h-8 text-white" />;
                })()}
              </div>
              <h3 className="text-2xl font-extrabold text-neutral-900 mb-3">
                {roles[activeRole].role}
              </h3>
              <p className="text-neutral-500 mb-6 text-base">{roles[activeRole].desc}</p>
              <ul className="space-y-3 mb-8">
                {roles[activeRole].features.map((feat) => (
                  <li key={feat} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-3 h-3 text-primary-600" />
                    </div>
                    <span className="text-neutral-700 font-medium">{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className={`inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white bg-gradient-to-r ${roles[activeRole].color} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
              >
                Masuk sebagai {roles[activeRole].role.split(" ")[0]}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TECH STACK ===== */}
      <section id="teknologi" className="py-24 bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block badge bg-white/10 text-white/70 mb-4 text-sm px-4 py-1.5">
              ✦ Tech Stack
            </span>
            <h2 className="text-4xl font-extrabold text-white mb-4">
              100% Gratis,{" "}
              <span className="gradient-text-ai">Enterprise-Grade</span>
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Dibangun dengan teknologi terdepan yang semuanya tersedia pada free tier.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Next.js 15", role: "Frontend & API Routes", desc: "App Router, Server Components, Edge Runtime", color: "border-white/20 hover:border-white/40" },
              { name: "TailwindCSS", role: "Styling & UI", desc: "Utility-first CSS dengan desain sistem kustom", color: "border-cyan-500/30 hover:border-cyan-400/60" },
              { name: "Supabase", role: "Database & Auth", desc: "PostgreSQL + RLS + Auth bawaan, free tier", color: "border-emerald-500/30 hover:border-emerald-400/60" },
              { name: "Groq Cloud", role: "AI Koreksi Otomatis", desc: "Llama 3.3 70B, inferensi super cepat <500ms", color: "border-ai-500/30 hover:border-ai-400/60" },
              { name: "Vercel", role: "Deployment & Hosting", desc: "Serverless edge deployment, free tier tanpa batas", color: "border-violet-500/30 hover:border-violet-400/60" },
              { name: "KaTeX + Markdown", role: "Rendering Rumus", desc: "LaTeX math rendering untuk materi FMIPA presisi tinggi", color: "border-amber-500/30 hover:border-amber-400/60" },
            ].map((t) => (
              <div key={t.name} className={`border ${t.color} rounded-2xl p-5 bg-white/5 transition-all duration-200`}>
                <p className="text-white font-bold text-lg mb-1">{t.name}</p>
                <p className="text-ai-400 text-xs font-semibold mb-2 uppercase tracking-wider">{t.role}</p>
                <p className="text-neutral-400 text-sm">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 hero-bg opacity-90" />
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Siap Memulai Perjalanan Belajarmu?
          </h2>
          <p className="text-white/70 text-lg mb-10">
            Bergabunglah dan rasakan pengalaman belajar konstruktivis yang didukung oleh kecerdasan buatan terkini.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-primary-600 font-bold text-lg px-10 py-4 rounded-2xl hover:bg-white/90 transition-all hover:shadow-2xl hover:-translate-y-1 duration-200"
          >
            Mulai Sekarang — Gratis
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-neutral-900 py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-hero-gradient flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">Evolva E-Learning</span>
          </div>
          <p className="text-neutral-500 text-sm text-center">
            © 2025 Evolva E-Learning · Platform Pembelajaran Konstruktivis FMIPA · Powered by Groq AI
          </p>
          <div className="flex gap-4">
            <Link href="/login" className="text-neutral-400 hover:text-white text-sm transition-colors">Masuk</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
