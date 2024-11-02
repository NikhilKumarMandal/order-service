import { Router } from "express";
import { asyncWrapper } from "../utils";
import { CoupanController } from "./coupan.controller";

const router = Router();

const coupanController = new CoupanController()

router.post("/",asyncWrapper(coupanController.create))

export default router