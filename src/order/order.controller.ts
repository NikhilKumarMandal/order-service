import {Request, Response } from "express";
import { CartItem, ProductPricingCache, Topping, ToppingPriceCache } from "../types";
import productCacheModel from "../productCache/productCache.model";
import toppingCacheModel from "../toppingCache/toppingCache.model";
import coupanModel from "../coupon/coupan.model";


export class OrderController{

    create = async (req: Request, res: Response) => {
       
        const totalPrice = await this.calculateTotal(req.body.cart);

        let discountPercentage = 0;
        let couponCode = req.body.couponCode;
        let tenantId = req.body.tenantId;

        if (couponCode) {
            discountPercentage = await this.calcluateDiscountPercentage(couponCode,tenantId)
        }

        const discountPrice = Math.round((totalPrice * discountPercentage) / 100)

        return res.json({discountPrice})
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