import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(1, "Name cannot be empty")
    .max(200, "Name must be at most 200 characters"),
  description: z
    .string({ error: "Description is required" })
    .trim()
    .min(1, "Description cannot be empty")
    .max(2000, "Description must be at most 2000 characters"),
  price: z
    .number({ error: "Price is required" })
    .nonnegative("Price must be zero or positive")
    .finite("Price must be a finite number"),
  stockQuantity: z
    .number({ error: "Stock quantity is required" })
    .int("Stock quantity must be an integer")
    .nonnegative("Stock quantity must be zero or positive"),
  category: z
    .string({ error: "Category is required" })
    .trim()
    .min(1, "Category cannot be empty")
    .max(100, "Category must be at most 100 characters"),
});

export const updateProductSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name cannot be empty")
      .max(200, "Name must be at most 200 characters"),
    description: z
      .string()
      .trim()
      .min(1, "Description cannot be empty")
      .max(2000, "Description must be at most 2000 characters"),
    price: z
      .number()
      .nonnegative("Price must be zero or positive")
      .finite("Price must be a finite number"),
    stockQuantity: z
      .number()
      .int("Stock quantity must be an integer")
      .nonnegative("Stock quantity must be zero or positive"),
    category: z
      .string()
      .trim()
      .min(1, "Category cannot be empty")
      .max(100, "Category must be at most 100 characters"),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  category: z.string().trim().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(["name", "price", "createdAt", "stockQuantity"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
