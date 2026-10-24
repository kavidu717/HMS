-- CreateTable
CREATE TABLE "employee_leave_records" (
    "id" BIGSERIAL NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "leave_type" VARCHAR(50) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "approved_by" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_leave_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_leave_records_employee_id_idx" ON "employee_leave_records"("employee_id");

-- CreateIndex
CREATE INDEX "employee_leave_records_status_idx" ON "employee_leave_records"("status");

-- CreateIndex
CREATE INDEX "employee_leave_records_start_date_end_date_idx" ON "employee_leave_records"("start_date", "end_date");

-- AddForeignKey
ALTER TABLE "employee_leave_records" ADD CONSTRAINT "employee_leave_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_leave_records" ADD CONSTRAINT "employee_leave_records_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
