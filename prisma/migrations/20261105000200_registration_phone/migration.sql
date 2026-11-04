BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE "Registration" ADD COLUMN "phone" TEXT;
COMMIT;
