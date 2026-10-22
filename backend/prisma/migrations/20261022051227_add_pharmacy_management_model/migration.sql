-- CreateTable
CREATE TABLE "medicines" (
    "id" BIGSERIAL NOT NULL,
    "medicine_code" VARCHAR(50) NOT NULL,
    "medicine_name" VARCHAR(150) NOT NULL,
    "brand_name" VARCHAR(150) NOT NULL,
    "generic_name" VARCHAR(150) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_variants" (
    "id" BIGSERIAL NOT NULL,
    "medicine_id" BIGINT NOT NULL,
    "strength" VARCHAR(50) NOT NULL,
    "dosage_form" VARCHAR(50) NOT NULL,
    "unit" VARCHAR(30) NOT NULL,
    "reorder_level" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicine_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_batches" (
    "id" BIGSERIAL NOT NULL,
    "medicine_variant_id" BIGINT NOT NULL,
    "batch_number" VARCHAR(100) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "purchase_price" DECIMAL(10,2) NOT NULL,
    "selling_price" DECIMAL(10,2) NOT NULL,
    "expiry_date" DATE NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicine_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" BIGSERIAL NOT NULL,
    "medicine_batch_id" BIGINT NOT NULL,
    "movement_type" VARCHAR(30) NOT NULL,
    "quantity_change" INTEGER NOT NULL,
    "reason" VARCHAR(255),
    "reference_number" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "medicines_medicine_code_key" ON "medicines"("medicine_code");

-- CreateIndex
CREATE INDEX "medicines_medicine_name_idx" ON "medicines"("medicine_name");

-- CreateIndex
CREATE INDEX "medicines_generic_name_idx" ON "medicines"("generic_name");

-- CreateIndex
CREATE INDEX "medicines_category_idx" ON "medicines"("category");

-- CreateIndex
CREATE INDEX "medicines_is_active_idx" ON "medicines"("is_active");

-- CreateIndex
CREATE INDEX "medicine_variants_medicine_id_idx" ON "medicine_variants"("medicine_id");

-- CreateIndex
CREATE INDEX "medicine_variants_is_active_idx" ON "medicine_variants"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "medicine_variants_medicine_id_strength_dosage_form_key" ON "medicine_variants"("medicine_id", "strength", "dosage_form");

-- CreateIndex
CREATE INDEX "medicine_batches_medicine_variant_id_idx" ON "medicine_batches"("medicine_variant_id");

-- CreateIndex
CREATE INDEX "medicine_batches_expiry_date_idx" ON "medicine_batches"("expiry_date");

-- CreateIndex
CREATE INDEX "medicine_batches_quantity_idx" ON "medicine_batches"("quantity");

-- CreateIndex
CREATE UNIQUE INDEX "medicine_batches_medicine_variant_id_batch_number_key" ON "medicine_batches"("medicine_variant_id", "batch_number");

-- CreateIndex
CREATE INDEX "stock_movements_medicine_batch_id_idx" ON "stock_movements"("medicine_batch_id");

-- CreateIndex
CREATE INDEX "stock_movements_movement_type_idx" ON "stock_movements"("movement_type");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- AddForeignKey
ALTER TABLE "medicine_variants" ADD CONSTRAINT "medicine_variants_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_batches" ADD CONSTRAINT "medicine_batches_medicine_variant_id_fkey" FOREIGN KEY ("medicine_variant_id") REFERENCES "medicine_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_medicine_batch_id_fkey" FOREIGN KEY ("medicine_batch_id") REFERENCES "medicine_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
