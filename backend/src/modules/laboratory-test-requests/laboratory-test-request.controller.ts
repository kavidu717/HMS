
import type { Request, Response, NextFunction } from "express";
import { createLaboratoryTestRequestSchema } from "./laboratory-test-request.schema.js";
import { collectLaboratoryTestSample, createLaboratoryTestRequest, enterLaboratoryTestResult, getLaboratoryReportData, getLaboratoryTestRequestById, getLaboratoryTestRequests } from "./laboratory-test-request.service.js";
import PDFDocument from "pdfkit";


export const createLaboratoryTestRequestController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validation = createLaboratoryTestRequestSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
      return;
    }

    const laboratoryTestRequest = await createLaboratoryTestRequest(
      validation.data,
    );

    res.status(201).json({
      success: true,
      message: "Laboratory test request created successfully",
      data: laboratoryTestRequest,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const statusByError: Record<string, number> = {
        PATIENT_NOT_FOUND: 404,
        DOCTOR_NOT_FOUND: 404,
        LABORATORY_TEST_NOT_FOUND: 404,
        LABORATORY_TEST_INACTIVE: 409,
      };

      const status = statusByError[error.message];

      if (status) {
        const messageByError: Record<string, string> = {
          PATIENT_NOT_FOUND: "Patient not found",
          DOCTOR_NOT_FOUND: "Doctor not found",
          LABORATORY_TEST_NOT_FOUND: "Laboratory test not found",
          LABORATORY_TEST_INACTIVE: "Laboratory test is inactive",
        };

        res.status(status).json({
          success: false,
          message: messageByError[error.message],
        });
        return;
      }
    }

    next(error);
  }
};


export const getLaboratoryTestRequestsController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const laboratoryTestRequests = await getLaboratoryTestRequests();

    res.status(200).json({
      success: true,
      message: "Laboratory test requests retrieved successfully",
      data: laboratoryTestRequests,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getLaboratoryTestRequestByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid laboratory test request ID",
      });
      return;
    }

    const laboratoryTestRequest =
      await getLaboratoryTestRequestById(id);

    res.status(200).json({
      success: true,
      message: "Laboratory test request retrieved successfully",
      data: laboratoryTestRequest,
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === "LABORATORY_TEST_REQUEST_NOT_FOUND"
    ) {
      res.status(404).json({
        success: false,
        message: "Laboratory test request not found",
      });
      return;
    }

    next(error);
  }
};


export const collectLaboratoryTestSampleController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid laboratory test request ID",
      });
      return;
    }

    const laboratoryTestRequest =
      await collectLaboratoryTestSample(id);

    res.status(200).json({
      success: true,
      message: "Laboratory test sample collected successfully",
      data: laboratoryTestRequest,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "LABORATORY_TEST_REQUEST_NOT_FOUND") {
        res.status(404).json({
          success: false,
          message: "Laboratory test request not found",
        });
        return;
      }

      if (error.message === "SAMPLE_COLLECTION_NOT_ALLOWED") {
        res.status(409).json({
          success: false,
          message:
            "Sample collection is not allowed for the current request status",
        });
        return;
      }
    }

    next(error);
  }
};

export const enterLaboratoryTestResultController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid laboratory test request ID",
      });
      return;
    }

    const result =
      typeof req.body?.result === "string"
        ? req.body.result.trim()
        : "";

    if (!result) {
      res.status(400).json({
        success: false,
        message: "Laboratory test result is required",
      });
      return;
    }

    const laboratoryTestRequest =
      await enterLaboratoryTestResult(id, result);

    res.status(200).json({
      success: true,
      message: "Laboratory test result entered successfully",
      data: laboratoryTestRequest,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "LABORATORY_TEST_REQUEST_NOT_FOUND") {
        res.status(404).json({
          success: false,
          message: "Laboratory test request not found",
        });
        return;
      }

      if (error.message === "RESULT_ENTRY_NOT_ALLOWED") {
        res.status(409).json({
          success: false,
          message:
            "Result entry is not allowed for the current request status",
        });
        return;
      }
    }

    next(error);
  }
};

export const generateLaboratoryReportController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid laboratory test request ID",
      });
      return;
    }

    const reportData = await getLaboratoryReportData(id);

    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: 45,
        bottom: 55,
        left: 45,
        right: 45,
      },
      bufferPages: true,
    });

    const safeRequestNumber = String(reportData.requestNumber).replace(
      /[^a-zA-Z0-9_-]/g,
      "_",
    );
    const filename = `laboratory-report-${safeRequestNumber}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`,
    );

    doc.on("error", (error: Error) => {
      if (!res.headersSent) {
        next(error);
      } else {
        res.destroy(error);
      }
    });

    doc.pipe(res);

    const navy = "#16324F";
    const teal = "#0F9D91";
    const lightBlue = "#EAF3F8";
    const lightGreen = "#E8F5E9";
    const darkText = "#263238";
    const mutedText = "#607D8B";
    const borderColor = "#D9E3EA";
    const white = "#FFFFFF";

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const left = 45;
    const right = pageWidth - 45;
    const contentWidth = right - left;
    const gap = 12;
    const cardWidth = (contentWidth - gap) / 2;

    const contentBottom = pageHeight - 70;
    let y = 145;
    const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Colombo",
    });
    const dateFormatter = new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeZone: "Asia/Colombo",
    });

    const drawContinuationHeader = (): void => {
      doc.rect(0, 0, pageWidth, 78).fill(navy);
      doc.rect(0, 74, pageWidth, 4).fill(teal);
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#B8E7E2")
        .text("HMS  |  HOSPITAL MANAGEMENT SYSTEM", left, 16);
      doc
        .font("Helvetica-Bold")
        .fontSize(15)
        .fillColor(white)
        .text("LABORATORY TEST REPORT", left, 34);
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#DCEAF4")
        .text(`Request No: ${reportData.requestNumber}`, right - 150, 20, {
          width: 150,
          align: "right",
        });
      y = 100;
    };

    const startNewPage = (): void => {
      doc.addPage();
      drawContinuationHeader();
    };

    const ensureSpace = (height: number): void => {
      if (y + height > contentBottom) {
        startNewPage();
      }
    };

    const drawSectionHeading = (title: string): void => {
      ensureSpace(38);
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(navy)
        .text(title, left, y);

      doc
        .moveTo(left, y + 21)
        .lineTo(right, y + 21)
        .strokeColor(borderColor)
        .lineWidth(1)
        .stroke();

      y += 33;
    };

    const drawField = (
      label: string,
      value: string,
      x: number,
      y: number,
      width: number,
    ): void => {
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(mutedText)
        .text(label.toUpperCase(), x, y, {
          width,
        });

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(darkText)
        .text(value || "N/A", x, y + 13, {
          width,
        });
    };

    const measureFieldHeight = (
      label: string,
      value: string,
      width: number,
    ): number => {
      doc.font("Helvetica").fontSize(8);
      const labelHeight = doc.heightOfString(label.toUpperCase(), { width });
      doc.font("Helvetica-Bold").fontSize(10);
      const valueHeight = doc.heightOfString(value || "N/A", { width });
      return labelHeight + 4 + valueHeight;
    };

    doc.rect(0, 0, pageWidth, 125).fill(navy);
    doc.rect(0, 120, pageWidth, 5).fill(teal);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#B8E7E2")
      .text("HMS  |  HOSPITAL MANAGEMENT SYSTEM", left, 25);

    doc
      .font("Helvetica-Bold")
      .fontSize(21)
      .fillColor(white)
      .text("LABORATORY TEST REPORT", left, 48);

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#DCEAF4")
      .text(`Request No: ${reportData.requestNumber}`, left, 83);

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#DCEAF4")
      .text(
        `Generated: ${dateTimeFormatter.format(new Date())}`,
        left,
        99,
      );

    const patientName = `${reportData.patient.firstName} ${reportData.patient.lastName}`;
    const doctorName = `${reportData.doctor.firstName} ${reportData.doctor.lastName}`;
    const requestStatus = String(reportData.status)
      .split("_")
      .map((part: string) => part[0] + part.slice(1).toLowerCase())
      .join(" ");
    const identityFieldWidth = cardWidth - 24;
    const identityNumberHeight = Math.max(
      measureFieldHeight(
        "Patient Number",
        reportData.patient.patientNumber,
        identityFieldWidth,
      ),
      measureFieldHeight(
        "Doctor Number",
        reportData.doctor.doctorNumber,
        identityFieldWidth,
      ),
    );
    const identityNameHeight = Math.max(
      measureFieldHeight("Patient Name", patientName, identityFieldWidth),
      measureFieldHeight("Doctor Name", doctorName, identityFieldWidth),
    );
    const cardHeight = Math.max(
      112,
      35 + identityNumberHeight + 8 + identityNameHeight + 14,
    );

    ensureSpace(cardHeight + 20);

    doc
      .roundedRect(left, y, cardWidth, cardHeight, 8)
      .fill(lightBlue);

    doc
      .rect(left, y + 8, 4, cardHeight - 16)
      .fill(teal);

    const doctorX = left + cardWidth + gap;

    doc
      .roundedRect(doctorX, y, cardWidth, cardHeight, 8)
      .fill("#F3F6F8");

    doc
      .rect(doctorX, y + 8, 4, cardHeight - 16)
      .fill(navy);

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(navy)
      .text("PATIENT DETAILS", left + 12, y + 12);

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(navy)
      .text("DOCTOR DETAILS", doctorX + 12, y + 12);

    drawField(
      "Patient Number",
      reportData.patient.patientNumber,
      left + 12,
      y + 35,
      identityFieldWidth,
    );

    drawField(
      "Patient Name",
      patientName,
      left + 12,
      y + 35 + identityNumberHeight + 8,
      identityFieldWidth,
    );

    drawField(
      "Doctor Number",
      reportData.doctor.doctorNumber,
      doctorX + 12,
      y + 35,
      identityFieldWidth,
    );

    drawField(
      "Doctor Name",
      doctorName,
      doctorX + 12,
      y + 35 + identityNumberHeight + 8,
      identityFieldWidth,
    );

    y += cardHeight + 18;

    drawField(
      "Date of Birth",
      dateFormatter.format(new Date(reportData.patient.dateOfBirth)),
      left,
      y,
      cardWidth,
    );

    drawField(
      "Gender",
      reportData.patient.gender,
      doctorX,
      y,
      cardWidth,
    );

    const personalDetailsHeight = Math.max(
      measureFieldHeight(
        "Date of Birth",
        String(reportData.patient.dateOfBirth).slice(0, 10),
        cardWidth,
      ),
      measureFieldHeight("Gender", reportData.patient.gender, cardWidth),
    );
    y += personalDetailsHeight + 10;

    drawField(
      "Doctor Specialization",
      reportData.doctor.specialization,
      left,
      y,
      cardWidth,
    );

    drawField(
      "Request Status",
      requestStatus,
      doctorX,
      y,
      cardWidth,
    );

    const requestDetailsHeight = Math.max(
      measureFieldHeight(
        "Doctor Specialization",
        reportData.doctor.specialization,
        cardWidth,
      ),
      measureFieldHeight("Request Status", requestStatus, cardWidth),
    );
    y += requestDetailsHeight + 18;

    drawSectionHeading("LABORATORY TEST DETAILS");

    const tableX = left;
    const labelWidth = 145;
    const valueWidth = contentWidth - labelWidth;

    const testRows: [string, string][] = [
      ["Test Code", reportData.laboratoryTest.testCode],
      ["Test Name", reportData.laboratoryTest.testName],
      ["Sample Type", reportData.laboratoryTest.sampleType],
    ];

    testRows.forEach(([label, value], index) => {
      const printableValue = value || "N/A";
      const valueTextWidth = valueWidth - 18;
      doc.font("Helvetica").fontSize(9);
      const valueHeight = doc.heightOfString(printableValue, {
        width: valueTextWidth,
      });
      const rowHeight = Math.max(32, valueHeight + 18);

      if (y + rowHeight > contentBottom) {
        startNewPage();
        drawSectionHeading("LABORATORY TEST DETAILS - CONTINUED");
      }

      const rowY = y;

      doc
        .rect(tableX, rowY, contentWidth, rowHeight)
        .fill(index % 2 === 0 ? lightBlue : white);

      doc
        .rect(tableX, rowY, 3, rowHeight)
        .fill(teal);

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(navy)
        .text(label, tableX + 12, rowY + 10, {
          width: labelWidth - 20,
        });

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(darkText)
        .text(printableValue, tableX + labelWidth, rowY + 9, {
          width: valueTextWidth,
        });

      y += rowHeight;
    });

    y += 20;

    ensureSpace(75);
    drawSectionHeading("TEST RESULTS");

    const resultText = reportData.result?.trim() || "No result available";
    const resultTextWidth = contentWidth - 32;
    const resultLineGap = 3;

    doc.font("Helvetica").fontSize(11);
    const wrapResultText = (text: string): string[] => {
      const lines: string[] = [];
      const paragraphs = text.replace(/\r/g, "").split("\n");

      for (const paragraph of paragraphs) {
        if (!paragraph.trim()) {
          lines.push("");
          continue;
        }

        let line = "";
        for (const word of paragraph.trim().split(/\s+/)) {
          const candidate = line ? `${line} ${word}` : word;

          if (doc.widthOfString(candidate) <= resultTextWidth) {
            line = candidate;
            continue;
          }

          if (line) {
            lines.push(line);
            line = "";
          }

          if (doc.widthOfString(word) <= resultTextWidth) {
            line = word;
            continue;
          }

          let fragment = "";
          for (const character of Array.from(word)) {
            if (
              fragment &&
              doc.widthOfString(`${fragment}${character}`) > resultTextWidth
            ) {
              lines.push(fragment);
              fragment = character;
            } else {
              fragment += character;
            }
          }
          line = fragment;
        }

        if (line) {
          lines.push(line);
        }
      }

      return lines.length ? lines : [""];
    };

    const resultLines = wrapResultText(resultText);
    let resultLineIndex = 0;
    let isFirstResultBlock = true;

    while (resultLineIndex < resultLines.length) {
      if (!isFirstResultBlock) {
        startNewPage();
        drawSectionHeading("TEST RESULTS - CONTINUED");
      }

      const maxBlockHeight = contentBottom - y;
      let blockEnd = resultLineIndex;
      let blockText = "";
      let measuredTextHeight = 0;

      while (blockEnd < resultLines.length) {
        const candidateLines = resultLines.slice(resultLineIndex, blockEnd + 1);
        const candidateText = candidateLines.join("\n");
        const candidateHeight = doc.heightOfString(candidateText, {
          width: resultTextWidth,
          lineGap: resultLineGap,
        });

        if (candidateHeight + 28 > maxBlockHeight && blockEnd > resultLineIndex) {
          break;
        }

        if (candidateHeight + 28 > maxBlockHeight) {
          startNewPage();
          drawSectionHeading("TEST RESULTS - CONTINUED");
          break;
        }

        blockEnd += 1;
        blockText = candidateText;
        measuredTextHeight = candidateHeight;
      }

      if (blockEnd === resultLineIndex) {
        continue;
      }

      const blockHeight = measuredTextHeight + 28;
      doc
        .roundedRect(left, y, contentWidth, blockHeight, 8)
        .fill(lightGreen);
      doc.rect(left, y + 8, 5, blockHeight - 16).fill(teal);
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor(darkText)
        .text(blockText, left + 16, y + 14, {
          width: resultTextWidth,
          lineGap: resultLineGap,
        });

      y += blockHeight + 12;
      resultLineIndex = blockEnd;
      isFirstResultBlock = false;
    }

    ensureSpace(74);
    drawSectionHeading("SAMPLE & RESULT TIMELINE");

    const sampleCollectedAt = reportData.sampleCollectedAt
      ? dateTimeFormatter.format(new Date(reportData.sampleCollectedAt))
      : "N/A";

    const resultEnteredAt = reportData.resultEnteredAt
      ? dateTimeFormatter.format(new Date(reportData.resultEnteredAt))
      : "N/A";

    drawField(
      "Sample Collected At",
      sampleCollectedAt,
      left,
      y,
      cardWidth,
    );

    drawField(
      "Result Entered At",
      resultEnteredAt,
      doctorX,
      y,
      cardWidth,
    );

    const pageRange = doc.bufferedPageRange();

    for (
      let pageIndex = pageRange.start;
      pageIndex < pageRange.start + pageRange.count;
      pageIndex++
    ) {
      doc.switchToPage(pageIndex);

      // Keep footer text inside PDFKit's bottom content margin so it cannot
      // trigger an automatic, blank overflow page.
      const footerY = pageHeight - 70;

      doc
        .moveTo(left, footerY - 8)
        .lineTo(right, footerY - 8)
        .strokeColor(borderColor)
        .lineWidth(1)
        .stroke();

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(mutedText)
        .text(
          "This report reflects laboratory results recorded in the HMS.",
          left,
          footerY,
          {
            width: contentWidth - 75,
          },
        );

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(mutedText)
        .text(
          `Page ${pageIndex + 1} of ${pageRange.count}`,
          right - 65,
          footerY,
          {
            width: 65,
            align: "right",
          },
        );
    }

    doc.end();
  } catch (error: unknown) {
    if (res.headersSent) {
      res.destroy(error instanceof Error ? error : undefined);
      return;
    }

    if (error instanceof Error) {
      if (error.message === "LABORATORY_TEST_REQUEST_NOT_FOUND") {
        res.status(404).json({
          success: false,
          message: "Laboratory test request not found",
        });
        return;
      }

      if (error.message === "LABORATORY_REPORT_NOT_READY") {
        res.status(409).json({
          success: false,
          message: "Laboratory report is not ready yet",
        });
        return;
      }
    }

    next(error);
  }
};
