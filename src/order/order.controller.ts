import {NextFunction, Request, Response } from "express";
import { CartItem, ProductPricingCache, Topping, ToppingPriceCache } from "../types";
import productCacheModel from "../productCache/productCache.model";
import toppingCacheModel from "../toppingCache/toppingCache.model";
import coupanModel from "../coupon/coupan.model";
import orderModel from "./order.model";
import { OrderStatus, PaymentMode, PaymentStatus } from "./order.types";
import idempotencyModel from "../idempotency/idempotency.model";
import mongoose from "mongoose";
import createHttpError from "http-errors";
import { PaymentGW } from "../payment/Payment.type";


export class OrderController{

    constructor(private paymentGW: PaymentGW){}

    create = async (req: Request, res: Response,next:NextFunction) => {

    const {
      cart,
      couponCode,
      tenantId,
      paymentMode,
      customerId,
      comment,
      address,
    } = req.body;
       
        const totalPrice = await this.calculateTotal(cart);

        let discountPercentage = 0;

        if (couponCode) {
            discountPercentage = await this.calcluateDiscountPercentage(couponCode,tenantId)
        }

        const discountPrice = Math.round((totalPrice * discountPercentage) / 100)

        const priceAfterDiscount = totalPrice - discountPrice;

        const TAX_PERCENT = 18;

        const taxes = Math.round((priceAfterDiscount * TAX_PERCENT) / 100);

        let DELIVERY_CHARGES = 100
        const finalPrice = priceAfterDiscount + discountPrice + DELIVERY_CHARGES

        const idempotencyKey = req.headers["idempotency-key"]

        const idempotency = await idempotencyModel.findOne({ key: idempotencyKey });

        let newOrder = idempotency ? [idempotency.response] : [];

        if (!idempotency) {
            const session = await mongoose.startSession();
            await session.startTransaction();
            try {
                newOrder = await orderModel.create([{
                    cart,
                    address,
                    comment,
                    customerId,
                    deliveryCharges: DELIVERY_CHARGES,
                    discount: discountPrice,
                    taxes,
                    tenantId,
                    total: finalPrice,
                    paymentMode,
                    orderStatus: OrderStatus.RECEIVED,
                    paymentStatus: PaymentStatus.PENDING,
                }
                ], {
                    session
                });

                await idempotencyModel.create([{
                    key: idempotencyKey,
                    response: newOrder[0]
                }],
                    {
                        session
                    },
                );
                
                await session.commitTransaction()
            } catch (error) {
                await session.abortTransaction();
                await session.endSession();

                return next(createHttpError(500, error.message));
            } finally {
                await session.endSession();
            }
        }

        if (paymentMode === PaymentMode.CARD) {
            const session = await this.paymentGW.createSession({
            amount: finalPrice,
            orderId: newOrder[0]._id.toString(),
            tenantId: tenantId,
            currency: "inr",
            idempotencyKey: idempotencyKey as string
        })
        return res.json({session: session.paymentUrl})
        }

        return res.json({paymentUrl: null})

    };

    private calculateTotal = async(cart:CartItem[]) => {

        const productIds = cart.map(item => item._id);

        const productPricing = await productCacheModel.find({
            productId: {
                $in: productIds
            }
        });

        const cartToppingIds = cart.reduce((acc, item) => {
            return [
                ...acc,
                ...item.chosenConfiguration.selectedToppings.map(
                    topping => topping.id
                )
            ]
        }, []);

        const toppingPricing = await toppingCacheModel.find({
            toppingId: {
                $in: cartToppingIds
            }
        });

        const totalPrice = cart.reduce((acc, curr) => {
            const cacheProductPrice = productPricing.find((product) => product.productId === curr._id)
            
            return (
                acc + curr.qty * this.getItemTotal(curr,cacheProductPrice,toppingPricing)
            )
        }, 0) 
        
        return totalPrice;
    }

    private getItemTotal = (
        cart: CartItem,
        cacheProductPrice: ProductPricingCache,
        toppingPricing: ToppingPriceCache[]
    ) => {
        const toppingTotal = cart.chosenConfiguration.selectedToppings.reduce((acc, item) => {
            return acc + this.getCurrentToppingPrice(item, toppingPricing)
        }, 0);

        const productTotal = Object.entries(cart.chosenConfiguration.priceConfiguration).reduce((acc, [key,value]) => {
            const price = cacheProductPrice.priceConfiguration[key].availableOptions[value];
            return acc + price
        },0)
        return productTotal + toppingTotal
    }

    private getCurrentToppingPrice = (topping: Topping, toppingPricing: ToppingPriceCache[]) => {
        const currentTopping = toppingPricing.find((current) => topping.id === current.toppingId);

        if (!currentTopping) {
            return topping.price
        }

        return currentTopping.price;
    }

    private calcluateDiscountPercentage = async (coupanCode: string,tenantId: string) => {
        const code = await coupanModel.findOne({ code: coupanCode, tenantId });

        if (!code) {
            return 0;
        }

        let currentDate = new Date();
        let coupanDate = new Date(code.validUpto);

        if (currentDate <= coupanDate) {
            return code.discount
        }

        return 0

    } 
}