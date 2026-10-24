
import { prisma } from "../../config/prisma.js";
import type {
  CreateInvoiceInput,
  RecordPaymentInput,
} from "./billing.schema.js";

export const createInvoice = async (input: CreateInvoiceInput) => {
  const patientId = BigInt(input.patientId);

  const patient = await prisma.patient.findUnique({
    where: {
      id: patientId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  if (patient.status !== "ACTIVE") {
    throw new Error("Cannot create an invoice for an inactive patient");
  }

  const totalAmount = input.items.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );

  const invoiceNumber = `INV-${Date.now()}`;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      patientId,
      totalAmount: totalAmount.toFixed(2),
      paidAmount: "0.00",
      balanceAmount: totalAmount.toFixed(2),
      status: "UNPAID",
      items: {
        create: input.items.map((item) => ({
          category: item.category,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          amount: (item.quantity * item.unitPrice).toFixed(2),
        })),
      },
    },
    include: {
      patient: {
        select: {
          id: true,
          patientNumber: true,
          firstName: true,
          lastName: true,
        },
      },
      items: true,
      payments: true,
    },
  });

  return {
    ...invoice,
    id: invoice.id.toString(),
    patientId: invoice.patientId.toString(),
    patient: {
      ...invoice.patient,
      id: invoice.patient.id.toString(),
    },
    items: invoice.items.map((item) => ({
      ...item,
      id: item.id.toString(),
      invoiceId: item.invoiceId.toString(),
    })),
    payments: invoice.payments.map((payment) => ({
      ...payment,
      id: payment.id.toString(),
      invoiceId: payment.invoiceId.toString(),
    })),
  };
};

export const getAllInvoices = async () => {
  const invoices = await prisma.invoice.findMany({
    orderBy: {
      invoiceDate: "desc",
    },
    include: {
      patient: {
        select: {
          id: true,
          patientNumber: true,
          firstName: true,
          lastName: true,
        },
      },
      items: true,
      payments: true,
    },
  });

  return invoices.map((invoice) => ({
    ...invoice,
    id: invoice.id.toString(),
    patientId: invoice.patientId.toString(),
    patient: {
      ...invoice.patient,
      id: invoice.patient.id.toString(),
    },
    items: invoice.items.map((item) => ({
      ...item,
      id: item.id.toString(),
      invoiceId: item.invoiceId.toString(),
    })),
    payments: invoice.payments.map((payment) => ({
      ...payment,
      id: payment.id.toString(),
      invoiceId: payment.invoiceId.toString(),
    })),
  }));
};

export const getInvoiceById = async (invoiceId: string) => {
  const id = BigInt(invoiceId);

  const invoice = await prisma.invoice.findUnique({
    where: {
      id,
    },
    include: {
      patient: {
        select: {
          id: true,
          patientNumber: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      },
      items: true,
      payments: {
        orderBy: {
          paidAt: "desc",
        },
      },
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  return {
    ...invoice,
    id: invoice.id.toString(),
    patientId: invoice.patientId.toString(),
    patient: {
      ...invoice.patient,
      id: invoice.patient.id.toString(),
    },
    items: invoice.items.map((item) => ({
      ...item,
      id: item.id.toString(),
      invoiceId: item.invoiceId.toString(),
    })),
    payments: invoice.payments.map((payment) => ({
      ...payment,
      id: payment.id.toString(),
      invoiceId: payment.invoiceId.toString(),
    })),
  };
};

export const getPatientInvoices = async (patientId: string) => {
  const id = BigInt(patientId);

  const patient = await prisma.patient.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
    },
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      patientId: id,
    },
    orderBy: {
      invoiceDate: "desc",
    },
    include: {
      items: true,
      payments: true,
    },
  });

  return invoices.map((invoice) => ({
    ...invoice,
    id: invoice.id.toString(),
    patientId: invoice.patientId.toString(),
    items: invoice.items.map((item) => ({
      ...item,
      id: item.id.toString(),
      invoiceId: item.invoiceId.toString(),
    })),
    payments: invoice.payments.map((payment) => ({
      ...payment,
      id: payment.id.toString(),
      invoiceId: payment.invoiceId.toString(),
    })),
  }));
};

export const recordPayment = async (input: RecordPaymentInput) => {
  const invoiceId = BigInt(input.invoiceId);
  const paymentAmount = input.amount;

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: {
        id: invoiceId,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (invoice.status === "CANCELLED") {
      throw new Error("Cannot record payment for a cancelled invoice");
    }

    const currentBalance = Number(invoice.balanceAmount);

    if (paymentAmount > currentBalance) {
      throw new Error("Payment amount cannot exceed the invoice balance");
    }

    const paidAmount = Number(invoice.paidAmount) + paymentAmount;
    const balanceAmount = Number(invoice.totalAmount) - paidAmount;

    const paymentNumber = `PAY-${Date.now()}-${Math.floor(
      Math.random() * 1000,
    )}`;

    const payment = await tx.payment.create({
      data: {
        paymentNumber,
        invoiceId,
        amount: paymentAmount.toFixed(2),
        paymentMethod: input.paymentMethod,
        referenceNumber: input.referenceNumber || null,
      },
    });

    const updatedInvoice = await tx.invoice.update({
      where: {
        id: invoiceId,
      },
      data: {
        paidAmount: paidAmount.toFixed(2),
        balanceAmount: balanceAmount.toFixed(2),
        status: balanceAmount === 0 ? "PAID" : "PARTIALLY_PAID",
      },
    });

    return {
      payment: {
        ...payment,
        id: payment.id.toString(),
        invoiceId: payment.invoiceId.toString(),
      },
      invoice: {
        ...updatedInvoice,
        id: updatedInvoice.id.toString(),
        patientId: updatedInvoice.patientId.toString(),
      },
    };
  });
};
