// @ts-expect-error Multer does not provide TypeScript declarations in this project.
import multer from "multer";
import type { Request } from "express";

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png"
];

export const uploadPatientDocument = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter: (
    _req: Request,
    file: { mimetype: string },
    callback: (error: Error | null, acceptFile: boolean) => void
  ) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(
        new Error("Only PDF, JPEG, and PNG files are allowed"),
        false
      );
      return;
    }

    callback(null, true);
  }
});