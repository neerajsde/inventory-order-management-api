import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import * as productController from "./product.controller.js";

const router = Router();

// All product routes require authentication
router.use(authenticate);

router.post("/", productController.create);
router.get("/", productController.getAll);
router.get("/:id", productController.getOne);
router.patch("/:id", productController.update);
router.delete("/:id", productController.remove);

export default router;
