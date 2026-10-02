-- CreateTable
CREATE TABLE "patients" (
    "id" BIGSERIAL NOT NULL,
    "patient_number" VARCHAR(50) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "gender" VARCHAR(20) NOT NULL,
    "nic" VARCHAR(20),
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(150),
    "address" VARCHAR(255),
    "emergency_contact_name" VARCHAR(150),
    "emergency_contact_phone" VARCHAR(20),
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_patient_number_key" ON "patients"("patient_number");

-- CreateIndex
CREATE UNIQUE INDEX "patients_nic_key" ON "patients"("nic");

-- CreateIndex
CREATE INDEX "patients_first_name_last_name_idx" ON "patients"("first_name", "last_name");

-- CreateIndex
CREATE INDEX "patients_phone_idx" ON "patients"("phone");

-- CreateIndex
CREATE INDEX "patients_patient_number_idx" ON "patients"("patient_number");
