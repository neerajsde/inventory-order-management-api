import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from "./product.validation.js";
import * as productService from "./product.service.js";
import { ApiError } from "../../utils/api-error.js";
import logger from "../../utils/logger.js";

// ─── Helper: validate MongoDB ObjectId ───────────────────────────────────────
function assertValidId(id: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID format", "INVALID_ID");
  }
}

// ─── POST /products ──────────────────────────────────────────────────────────
export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = createProductSchema.parse(req.body);
    const product = await productService.createProduct(data);

    logger.info({ productId: product._id }, "Product created");

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /products ───────────────────────────────────────────────────────────
export async function getAll(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = productQuerySchema.parse(req.query);
    const result = await productService.getProducts(query);

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /products/:id ──────────────────────────────────────────────────────
export async function getOne(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    assertValidId(id);
    const product = await productService.getProductById(id);

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /products/:id ────────────────────────────────────────────────────
export async function update(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    assertValidId(id);
    const data = updateProductSchema.parse(req.body);
    const product = await productService.updateProduct(id, data);

    logger.info({ productId: product._id }, "Product updated");

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /products/:id ───────────────────────────────────────────────────
export async function remove(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    assertValidId(id);
    await productService.deleteProduct(id);

    logger.info({ productId: id }, "Product deleted");

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    next(err);
  }
}
