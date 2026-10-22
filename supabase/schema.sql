-- =============================================================
-- EVOLVA E-LEARNING — Supabase PostgreSQL Schema
-- Jalankan ini di Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================
-- PROFILES
-- ========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'guru', 'siswa')) DEFAULT 'siswa',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper SECURITY DEFINER menghindari recursive RLS saat policy profiles
-- perlu memeriksa apakah pengguna saat ini adalah admin.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_guru_or_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('guru', 'admin')
  );
$$;

CREATE POLICY "Guru and admin can view student profiles" ON public.profiles
  FOR SELECT USING (role = 'siswa' AND public.is_guru_or_admin());

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles" ON public.profiles
  FOR SELECT USING (
    public.is_admin()
  );

CREATE POLICY "Admin can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    public.is_admin()
  );

CREATE POLICY "Admin can update profiles" ON public.profiles
  FOR UPDATE USING (
    public.is_admin()
  );

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'siswa')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ========================
-- KELAS (Classes)
-- ========================
CREATE TABLE public.kelas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL DEFAULT '2024/2025',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER kelas_updated_at
  BEFORE UPDATE ON public.kelas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Guru can create classes" ON public.kelas
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('guru', 'admin'))
  );

CREATE POLICY "Creator and admin can update classes" ON public.kelas
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ========================
-- KELAS MEMBERS
-- ========================
CREATE TABLE public.kelas_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kelas_id UUID NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('guru', 'siswa')) DEFAULT 'siswa',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(kelas_id, user_id)
);

ALTER TABLE public.kelas_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_class_teacher(p_kelas_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.kelas_members WHERE kelas_id = p_kelas_id AND user_id = auth.uid() AND role = 'guru'
  ) OR EXISTS (
    SELECT 1 FROM public.kelas WHERE id = p_kelas_id AND created_by = auth.uid()
  );
$$;

CREATE POLICY "Members can view class membership" ON public.kelas_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_class_teacher(kelas_id)
    OR public.is_admin()
  );

CREATE POLICY "Guru and admin can manage members" ON public.kelas_members
  FOR ALL
  USING (
    public.is_admin()
    OR public.is_class_teacher(kelas_id)
  )
  WITH CHECK (
    public.is_admin()
    OR (user_id = auth.uid() AND role = 'guru')
    OR public.is_class_teacher(kelas_id)
  );

-- Kelas policy yang bergantung pada tabel kelas_members harus dibuat
-- setelah tabel kelas_members tersedia.
CREATE POLICY "Members can view their classes" ON public.kelas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.kelas_members WHERE kelas_id = id AND user_id = auth.uid())
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ========================
-- MODUL PEMBELAJARAN
-- ========================
CREATE TABLE public.modul_pembelajaran (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kelas_id UUID NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.modul_pembelajaran ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER modul_updated_at
  BEFORE UPDATE ON public.modul_pembelajaran
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Class members can view available modules" ON public.modul_pembelajaran
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.kelas_members
      WHERE kelas_id = modul_pembelajaran.kelas_id AND user_id = auth.uid()
    )
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Guru can manage modules" ON public.modul_pembelajaran
  FOR ALL
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('guru', 'admin'))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('guru', 'admin'))
  );


-- ========================
-- MATERI
-- ========================
CREATE TABLE public.materi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modul_id UUID NOT NULL REFERENCES public.modul_pembelajaran(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT false,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'video', 'file')) DEFAULT 'text',
  file_url TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.materi ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER materi_updated_at
  BEFORE UPDATE ON public.materi
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Students can view available materials" ON public.materi
  FOR SELECT USING (
    (is_available = true AND EXISTS (
      SELECT 1 FROM public.modul_pembelajaran mp
      JOIN public.kelas_members km ON km.kelas_id = mp.kelas_id
      WHERE mp.id = modul_id AND km.user_id = auth.uid()
    ))
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Guru can manage materials" ON public.materi
  FOR ALL USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ========================
-- LKPD
-- ========================
CREATE TABLE public.lkpd (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modul_id UUID NOT NULL REFERENCES public.modul_pembelajaran(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL DEFAULT '',
  questions JSONB NOT NULL DEFAULT '[]',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT false,
  deadline TIMESTAMPTZ,
  max_score INTEGER NOT NULL DEFAULT 100,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lkpd ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER lkpd_updated_at
  BEFORE UPDATE ON public.lkpd
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Students can view available LKPD" ON public.lkpd
  FOR SELECT USING (
    (is_available = true AND EXISTS (
      SELECT 1 FROM public.modul_pembelajaran mp
      JOIN public.kelas_members km ON km.kelas_id = mp.kelas_id
      WHERE mp.id = modul_id AND km.user_id = auth.uid()
    ))
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Guru can manage LKPD" ON public.lkpd
  FOR ALL USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ========================
-- LKPD SUBMISSIONS
-- ========================
CREATE TABLE public.lkpd_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lkpd_id UUID NOT NULL REFERENCES public.lkpd(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('submitted', 'ai_grading', 'ai_graded', 'validated')) DEFAULT 'submitted',
  ai_score INTEGER,
  ai_feedback JSONB,
  final_score INTEGER,
  teacher_notes TEXT,
  validated_by UUID REFERENCES public.profiles(id),
  validated_at TIMESTAMPTZ,
  UNIQUE(lkpd_id, student_id)
);

ALTER TABLE public.lkpd_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own submissions" ON public.lkpd_submissions
  FOR SELECT USING (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('guru', 'admin'))
  );

CREATE POLICY "Students can submit LKPD" ON public.lkpd_submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "System can update submission status" ON public.lkpd_submissions
  FOR UPDATE USING (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('guru', 'admin'))
  );


-- ========================
-- PENGUMUMAN (Announcements)
-- ========================
CREATE TABLE public.pengumuman (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kelas_id UUID NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER pengumuman_updated_at
  BEFORE UPDATE ON public.pengumuman
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Class members can view announcements" ON public.pengumuman
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.kelas_members
      WHERE kelas_id = pengumuman.kelas_id AND user_id = auth.uid()
    )
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Guru can manage announcements" ON public.pengumuman
  FOR ALL USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ========================
-- SEED DATA (Admin account)
-- ========================
-- NOTE: Seed data created through Supabase Auth, then profile updated
-- Run this after creating admin via Supabase Dashboard or Auth API:
-- UPDATE public.profiles SET role = 'admin', full_name = 'Administrator Evolva' WHERE email = 'admin@evolva.id';


-- ========================
-- INDEXES for performance
-- ========================
CREATE INDEX idx_kelas_members_user ON public.kelas_members(user_id);
CREATE INDEX idx_kelas_members_kelas ON public.kelas_members(kelas_id);
CREATE INDEX idx_modul_kelas ON public.modul_pembelajaran(kelas_id);
CREATE INDEX idx_materi_modul ON public.materi(modul_id);
CREATE INDEX idx_lkpd_modul ON public.lkpd(modul_id);
CREATE INDEX idx_lkpd_submissions_student ON public.lkpd_submissions(student_id);
CREATE INDEX idx_lkpd_submissions_lkpd ON public.lkpd_submissions(lkpd_id);
CREATE INDEX idx_lkpd_submissions_status ON public.lkpd_submissions(status);
CREATE INDEX idx_pengumuman_kelas ON public.pengumuman(kelas_id);
