
import type { Request, Response, NextFunction } from "express";

import {
  createEmployeeLeaveRecord,
  getAllEmployeeLeaveRecords,
  getEmployeeLeaveRecordById,
  updateEmployeeLeaveRecord,
} from "./employee-leave-record.service.js";

import {
  createEmployeeLeaveRecordSchema,
  updateEmployeeLeaveRecordSchema,
} from "./employee-leave-record.validation.js";

export const createEmployeeLeaveRecordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validation = createEmployeeLeaveRecordSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.issues,
      });
      return;
    }

    const leaveRecord = await createEmployeeLeaveRecord({
      employeeId: validation.data.employeeId,
      leaveType: validation.data.leaveType,
      startDate: validation.data.startDate,
      endDate: validation.data.endDate,
      ...(validation.data.reason !== undefined && {
        reason: validation.data.reason,
      }),
    });

    res.status(201).json({
      success: true,
      message: "Leave request created successfully",
      data: leaveRecord,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllEmployeeLeaveRecordsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const employeeId =
      typeof req.query.employeeId === "string"
        ? req.query.employeeId
        : undefined;

    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : undefined;

    const leaveRecords = await getAllEmployeeLeaveRecords({
      ...(employeeId !== undefined && { employeeId }),
      ...(status !== undefined && { status }),
    });

    res.status(200).json({
      success: true,
      message: "Leave records retrieved successfully",
      data: leaveRecords,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeLeaveRecordByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid leave record ID",
      });
      return;
    }

    const leaveRecord = await getEmployeeLeaveRecordById(id);

    res.status(200).json({
      success: true,
      message: "Leave record retrieved successfully",
      data: leaveRecord,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmployeeLeaveRecordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid leave record ID",
      });
      return;
    }

    const validation = updateEmployeeLeaveRecordSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.issues,
      });
      return;
    }

    const leaveRecord = await updateEmployeeLeaveRecord(id, {
      ...(validation.data.leaveType !== undefined && {
        leaveType: validation.data.leaveType,
      }),
      ...(validation.data.startDate !== undefined && {
        startDate: validation.data.startDate,
      }),
      ...(validation.data.endDate !== undefined && {
        endDate: validation.data.endDate,
      }),
      ...(validation.data.reason !== undefined && {
        reason: validation.data.reason,
      }),
      ...(validation.data.status !== undefined && {
        status: validation.data.status,
      }),
    });

    res.status(200).json({
      success: true,
      message: "Leave request updated successfully",
      data: leaveRecord,
    });
  } catch (error) {
    next(error);
  }
};
