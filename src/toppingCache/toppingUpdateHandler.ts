import { ToppingMessage } from "../types";
import toppingCacheModel from "./toppingCache.model";

export const handleToppingUpdate = async (value: string) => {
  try {
    const topping: ToppingMessage = JSON.parse(value);
  
    return await toppingCacheModel.updateOne(
      {
        toppingId: topping.data.id,
      },
      {
        $set: {
          price: topping.data.price,
          tenantId: topping.data.tenantId,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    console.error("Failed to parse product or update database:", error);
    throw new Error("Product update failed");
  }
};