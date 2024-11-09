import Stripe from "stripe";
import { PaymentGW, PaymentOptions } from "./Payment.type";
import config from "config"
export class StripeGW implements PaymentGW{
    private stripe: Stripe
    
    constructor() {
        this.stripe = new Stripe(config.get("stripe.secretKey"))
    }
    async createSession(options: PaymentOptions) {
        const session = await this.stripe.checkout.sessions.create({
            metadata: {
                orderId: options.orderId
            },
            billing_address_collection: "required",
            line_items: [
                {
                    price_data: {
                        unit_amount: options.amount * 100,
                        product_data: {
                            name: "Online pizza order",
                            description: "Total amount to be paid",
                            images: [
                               " https://placehold.jp/150x150.png"
                            ]
                        },
                        currency: options.currency || "inr",
                    },
                    quantity: 1
                }
            ],
            mode: "payment",
            success_url: `${config.get("client.ui")}/payment?sucess=true&orderId=${options.orderId}`,
            cancel_url: `${config.get("client.ui")}/payment?sucess=false&orderId=${options.orderId}`
        },
            {
                idempotencyKey: options.idempotencyKey
            }
        )

        return {
            id: session.id,
            paymentUrl: session.url,
            paymentStatus: session.payment_status
        }
    }

    async getSession(id: string) {
        return null;
    }
}