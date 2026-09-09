-- Performance indexes for large family trees (5,000+ members)
-- Safe to run repeatedly in Supabase SQL Editor.

CREATE INDEX IF NOT EXISTS idx_members_generation_full_name
  ON public.members(generation ASC, full_name ASC);

CREATE INDEX IF NOT EXISTS idx_members_branch_generation
  ON public.members(branch_id, generation ASC);

CREATE INDEX IF NOT EXISTS idx_members_phai_generation
  ON public.members(phai_name, generation ASC);
