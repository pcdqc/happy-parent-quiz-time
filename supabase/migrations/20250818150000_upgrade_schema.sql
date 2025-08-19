-- 数据库升级迁移 - 基于现有结构添加新功能
-- 这是基于现有数据库的增量升级，避免重复创建已存在的对象

-- 1. 确保profiles表有必要的列（如不存在则添加）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. 确保quiz_results表有完整结构
ALTER TABLE public.quiz_results
  ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_created_at TIMESTAMP WITH TIME ZONE;

-- 3. 创建内容管理相关表（如果不存在）

-- reports表（用户举报系统）
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- settings表（敏感词和配置管理）
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建管理员检查函数（如果不存在）
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 确保RLS策略存在且正确

-- profiles表策略
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles'
    ) THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "用户可以查看自己的资料" ON public.profiles
          FOR SELECT USING (auth.uid() = id);
        CREATE POLICY "用户可以更新自己的资料" ON public.profiles
          FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- reports表策略
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reports'
    ) THEN
        ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "用户举报策略" ON public.reports
          FOR INSERT WITH CHECK (true);
        CREATE POLICY "管理员可以管理举报" ON public.reports
          FOR ALL USING (public.is_admin() = true);
    END IF;
END $$;

-- settings表策略
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'settings'
    ) THEN
        ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "管理员可以管理设置" ON public.settings
          FOR ALL USING (public.is_admin() = true);
    END IF;
END $$;

-- 6. 添加缺失的索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_reports_question_id ON public.reports(question_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id_date ON public.quiz_results(user_id, date);

-- 7. 确保敏感词配置存在（默认空数组）
INSERT INTO public.settings (key, value) 
VALUES ('sensitive_words', '[]') 
ON CONFLICT (key) DO NOTHING;