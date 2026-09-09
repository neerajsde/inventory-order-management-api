import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { createOrderSchema, orderQuerySchema } from "./order.validation.js";
import * as orderService from "./order.service.js";
import { ApiError } from "../../utils/api-error.js";
import logger from "../../utils/logger.js";

// ─── Helper: validate MongoDB ObjectId ───────────────────────────────────────
function assertValidId(id: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid order ID format", "INVALID_ID");
  }
}

// ─── POST /orders ────────────────────────────────────────────────────────────
export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = createOrderSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
    }

    // Validate all product IDs are valid ObjectIds
    for (const item of data.items) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        throw new ApiError(
          400,
          `Invalid product ID format: ${item.productId}`,
          "INVALID_ID"
        );
      }
    }

    const order = await orderService.createOrder(userId, data);

    logger.info({ orderId: order._id, userId }, "Order created");

    res.status(202).json({
      success: true,
      message: "Order accepted and is processing",
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /orders ─────────────────────────────────────────────────────────────
export async function getAll(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
    }

    const query = orderQuerySchema.parse(req.query);
    const result = await orderService.getUserOrders(userId, query);

    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /orders/:id ────────────────────────────────────────────────────────
export async function getOne(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
    }

    const id = req.params.id as string;
    assertValidId(id);

    const order = await orderService.getOrderById(id, userId);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
}
