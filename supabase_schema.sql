-- ==============================================================================
-- EatTogether 免费云端数据库初始化脚本 (Supabase)
-- 将此脚本粘贴至 Supabase 控制台的 "SQL Editor" 并点击 "Run" 执行即可。
-- ==============================================================================

-- 1. 创建 rooms 房间与协同数据表
CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY,
  user1_name TEXT NOT NULL DEFAULT '我',
  user2_name TEXT NOT NULL DEFAULT 'TA',
  availabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  restaurants JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 2. 开启行级安全策略 (RLS) 并允许任何人免登录读写其所在房间
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read and write for rooms" ON public.rooms;
CREATE POLICY "Allow public read and write for rooms" 
ON public.rooms 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- 3. 开启 Supabase Realtime 实时协同同步广播
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;

-- 4. 插入默认演示房间
INSERT INTO public.rooms (id, user1_name, user2_name, updated_at)
VALUES ('weekend-foodies', '我', 'TA', (extract(epoch from now()) * 1000)::bigint)
ON CONFLICT (id) DO NOTHING;
