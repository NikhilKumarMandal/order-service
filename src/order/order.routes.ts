import { Router } from "express";
import { OrderController } from "./order.controller";
import authenticate from "../common/middleware/authenticate";
import { StripeGW } from "../payment/stripe";

const router = Router();


const paymentGw = new StripeGW()

const orderController = new OrderController(paymentGw)

router.post("/order",authenticate,orderController.create)

export default router;