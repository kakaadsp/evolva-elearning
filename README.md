<div align="center">

# 🌱 Evolva E-Learning
### *Next-Generation Constructivist Learning Management System (LMS) for FMIPA*
Ditenagai oleh **Next.js 15 App Router**, **Groq AI (Llama 3.3 70B Versatile)**, **Supabase PostgreSQL**, dan **Tailwind CSS**.

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Groq AI](https://img.shields.io/badge/Groq%20Cloud-Llama%203.3%2070B-F55036?style=for-the-badge&logo=groq)](https://groq.com/)
[![KaTeX](https://img.shields.io/badge/KaTeX-LaTeX%20Math-00D084?style=for-the-badge)](https://katex.org/)

<p align="center">
  <a href="#-tentang-evolva">Tentang</a> •
  <a href="#-fitur-utama-berdasarkan-rubrik">Fitur Utama</a> •
  <a href="#-arsitektur--tech-stack">Tech Stack</a> •
  <a href="#-alur-kerja-pedagogis-ai">Alur AI</a> •
  <a href="#-panduan-instalasi--setup">Instalasi</a> •
  <a href="#-struktur-direktori">Struktur</a> •
  <a href="#-kontributor--lisensi">Lisensi</a>
</p>

---

</div>

## 📖 Tentang Evolva

**Evolva E-Learning** adalah platform pembelajaran daring modern berbasis pendekatan **konstruktivisme** yang dirancang khusus untuk memenuhi standar kurikulum akademik **Fakultas Matematika dan Ilmu Pengetahuan Alam (FMIPA)**. 

Platform ini memfasilitasi siklus pembelajaran aktif:
1. **Eksplorasi Mandiri**: Mahasiswa mempelajari materi ilmiah interaktif berstandar akademik tinggi lengkap dengan formulasi matematis dan notasi sains (**LaTeX/KaTeX**).
2. **Lembar Kerja Peserta Didik (LKPD)**: Workspace pengerjaan sekuensial terintegrasi yang mencegah distraksi navigasi dan melatih pemikiran analitis.
3. **Asesmen Cerdas Berbasis AI**: Evaluasi otomatis berbasis rubrik kriteria pedagogis menggunakan model **Llama 3.3 70B** via **Groq LPU Inference Engine**, memberikan *feedback* formatif instan dengan rincian skor, poin kekuatan, kelemahan, dan saran perbaikan.
4. **Validasi Pendidik (*Human-in-the-Loop*)**: Dosen/Guru memiliki kontrol penuh melalui antarmuka *side-by-side* untuk meninjau, mengesampingkan (override), atau menyetujui penilaian AI sebelum disahkan.

---

## 🎯 Fitur Utama (Berdasarkan Rubrik Penilaian Produk)

Platform dirancang memenuhi 100% kriteria **Rubrik Penilaian Produk E-Learning FMIPA**:

### 👑 1. Modul Admin (Bobot: 15 Poin)
- **A1. Manajemen Pengguna (CRUD & Realtime Status)**:
  - Pembuatan akun terpadu untuk Dosen/Guru, Mahasiswa/Siswa, dan Administrator.
  - Sakelar aktivasi akun instan (*Toggle Active/Inactive*) untuk proteksi akses akun.
- **A2. Manajemen Kelas & Rombel**:
  - Pembuatan kelas mata kuliah/pelajaran dengan kode kelas unik.
  - Alokasi guru pengampu dan pendaftaran anggota kelas (*enrollment*).
- **A3. Role-Based Access Control (RBAC)**:
  - Proteksi rute tingkat kernel via Next.js Middleware.
  - Isolasi data berlapis dengan **PostgreSQL Row Level Security (RLS)** pada Supabase.

### 🔬 2. Modul Guru / Dosen (Bobot: 50 Poin)
- **G1. Manajemen Materi & Silabus**:
  - Modul penyusunan materi dengan kontrol ketersediaan (*draft* / *published*).
- **G2. Studio LKPD & Soal Ilmiah**:
  - Editor soal multitipe (Esai analitis, Isian singkat, Pilihan ganda).
  - Integrasi sintaks **LaTeX** (`$...$`, `$$...$$`) untuk persamaan kalkulus, fisika teoretis, dan formula reaksi kimia.
  - Rubrik pedoman penilaian terstruktur per butir pertanyaan.
- **G3. Koreksi AI Otomatis (Groq Llama 3.3 70B)**:
  - Pemrosesan *inference* secepat kilat (<1.5 detik) melalui Groq Cloud API.
  - Evaluasi multi-dimensi: Skor numerik (0–100), analisis kekuatan konseptual, identifikasi miskonsepsi, dan rekomendasi studi lanjut.
- **G4. Dasbor Penilaian Berdampingan (*Side-by-Side Review*)**:
  - Kolom kiri: Lembar jawaban asli siswa + kunci/rubrik.
  - Kolom kanan: Rincian rekomendasi AI dengan slider/input modifikasi nilai guru secara transparan.
- **G5. Analitik Kelas & Pusat Informasi**:
  - Metrik statistik capaian ketuntasan rata-rata kelas dan distribusi nilai.
  - Papan pengumuman interaktif kelas.

### 🎓 3. Modul Siswa / Mahasiswa (Bobot: 20 Poin)
- **S1. Portal Kelas Interaktif**:
  - Akses cepat jadwal kelas terdaftar, progres pengerjaan, dan tugas aktif.
- **S2. Workspace LKPD Fokus**:
  - Desain antarmuka *single-surface* bebas distraksi: materi rujukan dan lembar respon berada dalam satu alur kerja harmonis.
- **S3. Umpan Balik Cepat & Transparansi Nilai**:
  - Publikasi nilai terverifikasi beserta catatan konstruktif untuk pembelajaran berulang.

### 💎 4. Aspek Visual & Performa (Bobot: 15 Poin)
- **P1. Identitas Visual Premium FMIPA**:
  - Tipografi modern **Plus Jakarta Sans** untuk kenyamanan membaca teks panjang dan **JetBrains Mono** untuk ekspresi matematis/kode.
  - Palet warna harmonis berstandar rasio kontras WCAG 2.1 AA (*Emerald Green, Slate Navy, Clean Neutral White*).
- **P2. Navigasi & Ergonomi**:
  - *Breadcrumbs* hierarkis di setiap subhalaman.
  - Navigasi sekuensial responsif untuk perangkat desktop, tablet, maupun seluler.
- **P3. Performa Ekstrem**:
  - Next.js 15 Server Components (RSC) untuk latensi awal minimal dan skor Web Vitals optimal.

---

## 🛠️ Arsitektur & Tech Stack

```mermaid
graph TD
    Client[Web Browser - Siswa / Guru / Admin] -->|HTTPS / Next.js SSR & CSR| App[Next.js 15 App Router]
    App -->|RBAC Guard| MW[Next.js Edge Middleware]
    App -->|Data & Auth Queries| Supa[(Supabase PostgreSQL + RLS + Storage)]
    App -->|Grading Prompt & Rubric| Groq[Groq LPU - Llama 3.3 70B Versatile]
    Groq -->|Structured JSON Feedback| App
```

| Layer | Teknologi | Peran & Alasan Pemilihan |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15** | Server-Side Rendering (SSR), Server Actions, App Router terbaru |
| **Language** | **TypeScript 5** | *Type safety* penuh dari skema database hingga komponen UI |
| **Styling** | **Tailwind CSS 3.4** | Desain responsif berstandar industri dengan palet warna terkurasi |
| **Database & Auth** | **Supabase (PostgreSQL)** | *Managed PostgreSQL*, enkripsi data, Row Level Security (RLS) |
| **AI Engine** | **Groq Cloud (Llama 3.3)** | Kecepatan inferensi ultra-tinggi untuk koreksi esai otomatis berakurasi tinggi |
| **Icons & Math** | **Lucide Icons & KaTeX** | Desain ikon minimalis modern dan rendering formula matematika cepat |

---

## 🔄 Alur Kerja Pedagogis AI

```mermaid
sequenceDiagram
    autonumber
    actor Siswa
    participant UI as Workspace LKPD
    participant Server as Next.js API (/api/ai/grade)
    participant Groq as Groq Llama 3.3 70B
    participant DB as Supabase DB
    actor Guru

    Siswa->>UI: Submit Lembar Jawaban LKPD
    UI->>Server: Kirim Payload Jawaban + Soal + Kunci Jawaban
    Server->>Groq: Generate Pedagogical Assessment (Prompt Rubrik)
    Groq-->>Server: Return Structured JSON (Score, Analysis, Strengths, Suggestions)
    Server->>DB: Simpan Submission (Status: 'graded_by_ai')
    Server-->>UI: Konfirmasi Pengiriman Selesai
    Guru->>DB: Buka Halaman Side-by-Side Review
    Guru->>DB: Verifikasi / Koreksi Skor Akhir (Status: 'verified')
    Siswa->>UI: Menerima Nilai & Feedback Konstruktif
```

---

## 📁 Struktur Direktori

```text
evolva-elearning/
├── public/                 # Aset statis & logo
├── src/
│   ├── app/
│   │   ├── api/            # Server Route Handlers
│   │   │   ├── admin/      # API manajemen pengguna & role
│   │   │   └── ai/grade/   # Endpoint integrasi Groq AI grading
│   │   ├── dashboard/      # Portal aplikasi terlindungi RBAC
│   │   │   ├── admin/      # Dashboard modul Administrator (A1-A3)
│   │   │   ├── guru/       # Dashboard modul Dosen/Guru (G1-G5)
│   │   │   └── siswa/      # Dashboard modul Mahasiswa/Siswa (S1-S3)
│   │   ├── login/          # Antarmuka otentikasi login
│   │   ├── globals.css     # CSS Global & utilitas Tailwind
│   │   ├── layout.tsx      # Root layout aplikasi
│   │   └── page.tsx        # Landing page publik Evolva
│   ├── components/
│   │   └── layout/         # Komponen arsitektur: Sidebar & TopNav
│   ├── lib/
│   │   ├── groq/           # Klien SDK Groq Cloud & prompt pedagogis
│   │   └── supabase/       # Klien Supabase (Client & Server Components)
│   ├── middleware.ts       # Next.js Middleware proteksi rute RBAC
│   └── types/              # Definisi interface TypeScript
└── supabase/
    └── schema.sql          # Skema database PostgreSQL DDL + RLS Policies
```

---

## 🚀 Panduan Instalasi & Setup

### 1. Prasyarat Sistem
- **Node.js**: v18.18.0 atau versi yang lebih baru
- **NPM / PNPM / Yarn**
- Akun layanan **[Supabase](https://supabase.com/)**
- Akun layanan **[Groq Cloud](https://console.groq.com/)**

### 2. Kloning Repositori
```bash
git clone https://github.com/kakaadsp/evolva-elearning.git
cd evolva-elearning
```

### 3. Instalasi Dependensi
```bash
npm install
```

### 4. Konfigurasi Environment (`.env.local`)
Buat berkas `.env.local` pada direktori *root* proyek:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Groq AI Configuration
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### 5. Setup Database Supabase
1. Masuk ke **[Supabase Dashboard](https://app.supabase.com/)** dan buat proyek baru.
2. Navigasikan ke menu **SQL Editor**.
3. Buka berkas [`supabase/schema.sql`](./supabase/schema.sql), salin seluruh kueri DDL, lalu klik tombol **Run**.
4. Skema akan menginisialisasi 7 tabel relasional utama, relasi *Foreign Key*, *Triggers*, dan kebijakan keamanan **RLS (Row Level Security)**.

### 6. Menjalankan Server Lokal
```bash
npm run dev
```
Akses aplikasi melalui browser di **`http://localhost:3000`**.

---

## 🚢 Panduan Deployment (Vercel)

Proyek ini telah dikonfigurasi optimal untuk penyebaran di platform **Vercel**:

1. Unggah kode ke repositori GitHub.
2. Masuk ke **[Vercel Dashboard](https://vercel.com/)** dan pilih **Add New Project** → Import repositori `evolva-elearning`.
3. Pada bagian **Environment Variables**, daftarkan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`
4. Klik **Deploy**. Aplikasi akan otomatis di-build dan siap digunakan secara publik.

---

## 📄 Kontributor & Lisensi

Dikembangkan dengan dedikasi untuk kemajuan ekosistem pendidikan FMIPA.

- **Pengembang**: Tim Evolva E-Learning ([@kakaadsp](https://github.com/kakaadsp))
- **Lisensi**: Proyek ini dirilis di bawah lisensi [MIT License](LICENSE).

<div align="center">

**🌱 Evolva E-Learning · Empowering Mind, Elevating Science**

</div>
