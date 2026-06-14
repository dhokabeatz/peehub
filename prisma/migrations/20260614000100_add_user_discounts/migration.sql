CREATE TYPE "DiscountType" AS ENUM ('percentage', 'fixed');

CREATE TABLE "user_discounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_discounts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "orders"
    ADD COLUMN "base_amount" DECIMAL(10,2),
    ADD COLUMN "discount_amount" DECIMAL(10,2),
    ADD COLUMN "applied_discount_id" UUID,
    ADD COLUMN "applied_discount_type" "DiscountType",
    ADD COLUMN "applied_discount_value" DECIMAL(10,2);

CREATE INDEX "user_discounts_user_id_is_active_idx" ON "user_discounts"("user_id", "is_active");
CREATE INDEX "user_discounts_user_id_starts_at_ends_at_idx" ON "user_discounts"("user_id", "starts_at", "ends_at");
CREATE INDEX "user_discounts_created_by_idx" ON "user_discounts"("created_by");
CREATE INDEX "orders_applied_discount_id_idx" ON "orders"("applied_discount_id");

ALTER TABLE "user_discounts"
    ADD CONSTRAINT "user_discounts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_discounts"
    ADD CONSTRAINT "user_discounts_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "orders"
    ADD CONSTRAINT "orders_applied_discount_id_fkey"
    FOREIGN KEY ("applied_discount_id") REFERENCES "user_discounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
