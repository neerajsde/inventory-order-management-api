import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import * as orderController from "./order.controller.js";

const router = Router();

// All order routes require authentication
router.use(authenticate);

router.post("/", orderController.create);
router.get("/", orderController.getAll);
router.get("/:id", orderController.getOne);

export default router;
