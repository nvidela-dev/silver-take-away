ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "workspace_preferences" jsonb NOT NULL DEFAULT '{}'::jsonb;
