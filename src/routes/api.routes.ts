import express from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import productRoutes from "../modules/product/product.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);

export default router;