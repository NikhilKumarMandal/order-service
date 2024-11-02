import { Router } from "express";
import { asyncWrapper } from "../utils";
import { CustomerController } from "./customer.controller";
import authenticate from "../common/middleware/authenticate";

const router = Router();

const customerController = new CustomerController()

router.get("/", authenticate, asyncWrapper(customerController.getCustomer))



export default router