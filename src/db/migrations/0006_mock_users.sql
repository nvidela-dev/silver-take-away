DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'clerk_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'mock_user_key'
  ) THEN
    ALTER TABLE "users" RENAME COLUMN "clerk_id" TO "mock_user_key";
  END IF;
END $$;--> statement-breakpoint

ALTER INDEX IF EXISTS "users_clerk_id_unique"
  RENAME TO "users_mock_user_key_unique";

DO $$
DECLARE
  legacy_admin_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "users"
    WHERE "mock_user_key" = 'admin'
  ) THEN
    SELECT "id"
    INTO legacy_admin_id
    FROM "users"
    WHERE "role" = 'admin'
      AND "mock_user_key" LIKE 'user_%'
    ORDER BY "created_at"
    LIMIT 1;
  END IF;

  UPDATE "users"
  SET
    "mock_user_key" = CASE
      WHEN "id" = legacy_admin_id THEN 'admin'
      ELSE 'legacy-' || "id"::text
    END,
    "email" = CASE
      WHEN "id" = legacy_admin_id THEN 'admin@bill-pay.local'
      ELSE 'legacy-' || "id"::text || '@bill-pay.local'
    END,
    "full_name" = CASE
      WHEN "id" = legacy_admin_id THEN 'Avery Admin'
      ELSE 'Legacy User'
    END,
    "updated_at" = now()
  WHERE "mock_user_key" LIKE 'user_%';
END $$;
