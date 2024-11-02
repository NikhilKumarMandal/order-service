import { NextFunction, Request, Response } from "express";
import coupanModel from "./coupan.model";
import createHttpError from "http-errors";


export class CoupanController {

    create = async (req: Request, res: Response) => {
        const { title, code, validUpto, discount, tenantId } = req.body;

        const coupon = await coupanModel.create({
        title,
        code,
        discount,
        validUpto,
        tenantId,
        });

    return res.json(coupon);
    }
}