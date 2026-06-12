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
