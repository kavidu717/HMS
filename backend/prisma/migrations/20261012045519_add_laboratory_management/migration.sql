-- CreateTable
CREATE TABLE "laboratory_tests" (
    "id" BIGSERIAL NOT NULL,
    "test_code" VARCHAR(50) NOT NULL,
    "test_name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "sample_type" VARCHAR(100) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laboratory_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laboratory_test_requests" (
    "id" BIGSERIAL NOT NULL,
    "request_number" VARCHAR(50) NOT NULL,
    "patient_id" BIGINT NOT NULL,
    "doctor_id" BIGINT NOT NULL,
    "laboratory_test_id" BIGINT NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'REQUESTED',
    "sample_collected_at" TIMESTAMP(3),
    "result" TEXT,
    "result_entered_at" TIMESTAMP(3),
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laboratory_test_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "laboratory_tests_test_code_key" ON "laboratory_tests"("test_code");

-- CreateIndex
CREATE INDEX "laboratory_tests_test_name_idx" ON "laboratory_tests"("test_name");

-- CreateIndex
CREATE INDEX "laboratory_tests_is_active_idx" ON "laboratory_tests"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "laboratory_test_requests_request_number_key" ON "laboratory_test_requests"("request_number");

-- CreateIndex
CREATE INDEX "laboratory_test_requests_patient_id_idx" ON "laboratory_test_requests"("patient_id");

-- CreateIndex
CREATE INDEX "laboratory_test_requests_doctor_id_idx" ON "laboratory_test_requests"("doctor_id");

-- CreateIndex
CREATE INDEX "laboratory_test_requests_laboratory_test_id_idx" ON "laboratory_test_requests"("laboratory_test_id");

-- CreateIndex
CREATE INDEX "laboratory_test_requests_status_idx" ON "laboratory_test_requests"("status");

-- CreateIndex
CREATE INDEX "laboratory_test_requests_requested_at_idx" ON "laboratory_test_requests"("requested_at");

-- AddForeignKey
ALTER TABLE "laboratory_test_requests" ADD CONSTRAINT "laboratory_test_requests_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laboratory_test_requests" ADD CONSTRAINT "laboratory_test_requests_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laboratory_test_requests" ADD CONSTRAINT "laboratory_test_requests_laboratory_test_id_fkey" FOREIGN KEY ("laboratory_test_id") REFERENCES "laboratory_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
