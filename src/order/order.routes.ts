import { Router } from "express";
import { OrderController } from "./order.controller";
import authenticate from "../common/middleware/authenticate";

const router = Router();


const orderController = new OrderController()

router.post("/order",authenticate,orderController.create)

export default router;