import { NextFunction, Request, Response } from "express";
import coupanModel from "./coupan.model";
import createHttpError from "http-errors";


export class CoupanController {

    create = async (req: Request, res: Response) => {
    const { title, code, validUpto, discount, tenantId } = req.body;

    try {
        const coupon = await coupanModel.create({
            title,
            code,
            discount,
            validUpto,
            tenantId,
        });

        return res.json(coupon);
    } catch (error) {
        console.error('Error creating coupon:', error);
        return res.status(500).json({ error: 'Failed to create coupon' });
    }
    };


    getAll = async (req: Request, res: Response) => {

        const { coupanId } = req.params;
        
        const coupan = await coupanModel.findById({ coupanId });

        res.json(coupan)
    }
}