import { SortOrder } from "mongoose";
import { Product, IProduct } from "../../models/product.model.js";
import { ApiError } from "../../utils/api-error.js";
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
} from "./product.validation.js";

// ─── Create ──────────────────────────────────────────────────────────────────
export async function createProduct(data: CreateProductInput): Promise<IProduct> {
  const product = new Product(data);
  return product.save();
}

// ─── Get All (with pagination, filtering, sorting, search) ───────────────────
export interface PaginatedProducts {
  products: IProduct[];
  pagination: {
    page: number;
    limit: number;
    totalDocs: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export async function getProducts(query: ProductQueryInput): Promise<PaginatedProducts> {
  const { page, limit, category, search, sortBy, sortOrder, minPrice, maxPrice } = query;

  const filter: Record<string, any> = {};

  if (category) {
    filter.category = category.toLowerCase();
  }

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {} as any;
    if (minPrice !== undefined) (filter.price as any).$gte = minPrice;
    if (maxPrice !== undefined) (filter.price as any).$lte = maxPrice;
  }

  const sort: Record<string, SortOrder> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
  const skip = (page - 1) * limit;

  const [products, totalDocs] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalDocs / limit);

  return {
    products: products as IProduct[],
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

// ─── Get One ─────────────────────────────────────────────────────────────────
export async function getProductById(id: string): Promise<IProduct> {
  const product = await Product.findById(id).lean();
  if (!product) {
    throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }
  return product as IProduct;
}

// ─── Update ──────────────────────────────────────────────────────────────────
export async function updateProduct(
  id: string,
  data: UpdateProductInput
): Promise<IProduct> {
  const product = await Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();

  if (!product) {
    throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }
  return product as IProduct;
}

// ─── Delete ──────────────────────────────────────────────────────────────────
export async function deleteProduct(id: string): Promise<void> {
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }
}
