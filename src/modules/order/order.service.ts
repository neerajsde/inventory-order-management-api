import mongoose from "mongoose";
import { Product } from "../../models/product.model.js";
import { Order, IOrder, IOrderItem } from "../../models/order.model.js";
import { ApiError } from "../../utils/api-error.js";
import logger from "../../utils/logger.js";
import type { CreateOrderInput, OrderQueryInput } from "./order.validation.js";

// ─── Create Order ────────────────────────────────────────────────────────────
export async function createOrder(
  userId: string,
  data: CreateOrderInput
): Promise<IOrder> {
  // 1. Check for duplicate product IDs in the request
  const productIds = data.items.map((item) => item.productId);
  const uniqueIds = new Set(productIds);
  if (uniqueIds.size !== productIds.length) {
    throw new ApiError(400, "Duplicate products in order are not allowed", "DUPLICATE_ITEMS");
  }

  // 2. Fetch all products in one query
  const products = await Product.find({ _id: { $in: productIds } });

  // 3. Validate every product exists
  if (products.length !== productIds.length) {
    const foundIds = new Set(products.map((p) => p._id.toString()));
    const missingIds = productIds.filter((id) => !foundIds.has(id));
    throw new ApiError(
      404,
      `Products not found: ${missingIds.join(", ")}`,
      "PRODUCT_NOT_FOUND"
    );
  }

  // 4. Build a map for quick lookup
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  // 5. Validate stock and build order items
  const orderItems: IOrderItem[] = [];
  let totalAmount = 0;

  for (const item of data.items) {
    const product = productMap.get(item.productId)!;

    if (product.stockQuantity < item.quantity) {
      throw new ApiError(
        400,
        `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
        "INSUFFICIENT_STOCK"
      );
    }

    const subtotal = +(product.price * item.quantity).toFixed(2);
    orderItems.push({
      product: product._id as mongoose.Types.ObjectId,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      subtotal,
    });
    totalAmount += subtotal;
  }

  totalAmount = +totalAmount.toFixed(2);

  // 6. Reduce stock atomically using optimistic concurrency
  //    Each update uses { stockQuantity: { $gte: quantity } } as a guard
  //    so stock can never go negative, even without transactions.
  for (const item of data.items) {
    const result = await Product.updateOne(
      {
        _id: item.productId,
        stockQuantity: { $gte: item.quantity },
      },
      { $inc: { stockQuantity: -item.quantity } }
    );

    if (result.modifiedCount === 0) {
      // Rollback previously decremented items
      const currentIndex = data.items.indexOf(item);
      for (let i = 0; i < currentIndex; i++) {
        const prev = data.items[i];
        await Product.updateOne(
          { _id: prev.productId },
          { $inc: { stockQuantity: prev.quantity } }
        );
      }

      const product = productMap.get(item.productId)!;
      throw new ApiError(
        409,
        `Stock changed for "${product.name}" during order processing. Please retry.`,
        "STOCK_CONFLICT"
      );
    }
  }

  // 7. Create the order
  try {
    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount,
      status: "pending",
    });

    return order;
  } catch (error) {
    // Rollback stock if order creation fails
    logger.error({ error }, "Order creation failed, rolling back stock");
    for (const item of data.items) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stockQuantity: item.quantity } }
      );
    }
    throw error;
  }
}

// ─── Get User's Orders (paginated) ──────────────────────────────────────────
export interface PaginatedOrders {
  orders: IOrder[];
  pagination: {
    page: number;
    limit: number;
    totalDocs: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export async function getUserOrders(
  userId: string,
  query: OrderQueryInput
): Promise<PaginatedOrders> {
  const { page, limit, status } = query;

  const filter: Record<string, any> = { user: userId };
  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const [orders, totalDocs] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("items.product", "name category")
      .lean(),
    Order.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalDocs / limit);

  return {
    orders: orders as IOrder[],
    pagination: {
      page,
      limit,
      totalDocs,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

// ─── Get Single Order ────────────────────────────────────────────────────────
export async function getOrderById(
  orderId: string,
  userId: string
): Promise<IOrder> {
  const order = await Order.findOne({ _id: orderId, user: userId })
    .populate("items.product", "name category")
    .lean();

  if (!order) {
    throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
  }

  return order as IOrder;
}
