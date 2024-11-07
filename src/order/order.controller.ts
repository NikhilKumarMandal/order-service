import {Request, Response } from "express";
import { CartItem, ProductPricingCache, Topping, ToppingPriceCache } from "../types";
import productCacheModel from "../productCache/productCache.model";
import toppingCacheModel from "../toppingCache/toppingCache.model";


export class OrderController{

    create = async (req: Request, res: Response) => {
       
        const totalPrice = await this.calculateTotal(req.body.cart)
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
}