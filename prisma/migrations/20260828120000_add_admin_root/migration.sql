-- AlterTable
ALTER TABLE "users" ADD COLUMN "is_root" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Mark the earliest administrator as the root account
WITH first_admin AS (
  SELECT id
  FROM "users"
  WHERE role = 'ADMIN'
  ORDER BY id ASC
  LIMIT 1
)
UPDATE "users"
SET "is_root" = true
FROM first_admin
WHERE "users".id = first_admin.id;
