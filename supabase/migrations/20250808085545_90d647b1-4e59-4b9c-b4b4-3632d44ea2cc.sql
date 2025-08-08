
-- 1) quiz_results：分享统计字段 + 唯一索引 + UPDATE 策略 + 触发器

ALTER TABLE public.quiz_results
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_created_at timestamptz;

-- 唯一索引：仅在 shareable_name 非空时约束唯一
CREATE UNIQUE INDEX IF NOT EXISTS quiz_results_shareable_name_unique
  ON public.quiz_results (shareable_name)
  WHERE shareable_name IS NOT NULL;

-- 允许用户更新自己的答题记录（用于开启/关闭分享等）
CREATE POLICY "Users can update their own quiz results"
  ON public.quiz_results
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 通用 updated_at 触发函数（供多个表复用）
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$fn$;

-- 在更新 quiz_results 时，第一次设置 shareable_name 时写入 share_created_at
CREATE OR REPLACE FUNCTION public.set_share_created_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $fn$
BEGIN
  IF NEW.shareable_name IS NOT NULL
     AND (OLD.shareable_name IS DISTINCT FROM NEW.shareable_name) THEN
    IF OLD.shareable_name IS NULL THEN
      NEW.share_created_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_quiz_results_set_share_created_at ON public.quiz_results;
CREATE TRIGGER trg_quiz_results_set_share_created_at
BEFORE UPDATE ON public.quiz_results
FOR EACH ROW
EXECUTE PROCEDURE public.set_share_created_at();

-- 匿名增长分享计数（浏览/点赞）
CREATE OR REPLACE FUNCTION public.increment_share_metric(p_shareable_name text, p_metric text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $fn$
BEGIN
  IF p_metric = 'view' THEN
    UPDATE public.quiz_results
       SET views_count = views_count + 1
     WHERE shareable_name = p_shareable_name;
  ELSIF p_metric = 'like' THEN
    UPDATE public.quiz_results
       SET likes_count = likes_count + 1
     WHERE shareable_name = p_shareable_name;
  ELSE
    RAISE EXCEPTION 'Invalid metric: %', p_metric;
  END IF;
END;
$fn$;

-- 2) 预设参考书籍：表 + RLS + 触发器

CREATE TABLE IF NOT EXISTS public.reference_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text,
  edition text,
  isbn text,
  cover_url text,
  description text,
  tags text[],
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reference_books ENABLE ROW LEVEL SECURITY;

-- 所有人可查看启用的书籍
CREATE POLICY "Everyone can view active reference books"
  ON public.reference_books
  FOR SELECT
  USING (is_active = true);

-- 管理员可管理全部
CREATE POLICY "Admins can manage reference books"
  ON public.reference_books
  FOR ALL
  USING (is_admin(auth.uid()));

-- 可选：创建者管理自己的书籍（与管理员并行）
CREATE POLICY "Creators can manage own reference books"
  ON public.reference_books
  FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- updated_at 触发器
DROP TRIGGER IF EXISTS trg_reference_books_set_updated_at ON public.reference_books;
CREATE TRIGGER trg_reference_books_set_updated_at
BEFORE UPDATE ON public.reference_books
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

-- questions 关联参考书籍（可空）+ 章节页码备注
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS reference_book_id uuid REFERENCES public.reference_books(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reference_section text;

-- 3) 运营：公告表 + RLS + 触发器

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  url text,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 公告：仅在启用且时间窗内对所有人可见
CREATE POLICY "Everyone can view active announcements"
  ON public.announcements
  FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

-- 管理员可管理公告
CREATE POLICY "Admins can manage announcements"
  ON public.announcements
  FOR ALL
  USING (is_admin(auth.uid()));

-- updated_at 触发器
DROP TRIGGER IF EXISTS trg_announcements_set_updated_at ON public.announcements;
CREATE TRIGGER trg_announcements_set_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();
