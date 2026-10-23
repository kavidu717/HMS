import type { Request, Response } from "express";
import {
  createInvoiceSchema,
  recordPaymentSchema,
} from "./billing.schema.js";
import {
  createInvoice as createInvoiceService,
  getAllInvoices as getAllInvoicesService,
  getInvoiceById as getInvoiceByIdService,
  getPatientInvoices as getPatientInvoicesService,
  recordPayment as recordPaymentService,
} from "./billing.service.js";

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const input = createInvoiceSchema.parse(req.body);
    const invoice = await createInvoiceService(input);

    return res.status(201).json({
      success: true,
      message: "Invoice generated successfully",
      data: invoice,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Patient not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error.message ===
        "Cannot create an invoice for an inactive patient"
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }

    console.error("Create invoice error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate invoice",
    });
  }
};

export const getAllInvoices = async (
  req: Request,
  res: Response,
) => {
  try {
    const invoices = await getAllInvoicesService();

    return res.status(200).json({
      success: true,
      message: "Invoices retrieved successfully",
      data: invoices,
    });
  } catch (error) {
    console.error("Get all invoices error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve invoices",
    });
  }
};

export const getInvoiceById = async (
  req: Request,
  res: Response,
) => {
  try {
    const invoiceId = req.params.id;

    if (
      typeof invoiceId !== "string" ||
      !/^[1-9]\d*$/.test(invoiceId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID",
      });
    }

    const invoice = await getInvoiceByIdService(invoiceId);

    return res.status(200).json({
      success: true,
      message: "Invoice retrieved successfully",
      data: invoice,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Invoice not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Get invoice error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve invoice",
    });
  }
};

export const getPatientInvoices = async (
  req: Request,
  res: Response,
) => {
  try {
    const patientId = req.params.patientId;

    if (
      typeof patientId !== "string" ||
      !/^[1-9]\d*$/.test(patientId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
    }

    const invoices = await getPatientInvoicesService(patientId);

    return res.status(200).json({
      success: true,
      message: "Patient invoices retrieved successfully",
      data: invoices,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Patient not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Get patient invoices error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve patient invoices",
    });
  }
};

export const recordPayment = async (
  req: Request,
  res: Response,
) => {
  try {
    const input = recordPaymentSchema.parse(req.body);
    const result = await recordPaymentService(input);

    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Invoice not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error.message ===
          "Payment amount cannot exceed the invoice balance" ||
        error.message ===
          "Cannot record payment for a cancelled invoice"
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }

    console.error("Record payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to record payment",
    });
  }
};