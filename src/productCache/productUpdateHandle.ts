import { ProductMessage } from "../types";
import productCacheModel from "./productCache.model";

export const handleProductUpdate = async (value: string) => {
  try {
    const product: ProductMessage = JSON.parse(value);
    
    return await productCacheModel.updateOne(
      {
        productId: product.data.id,
      },
      {
        $set: {
          priceConfiguration: product.data.priceConfiguration,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    console.error("Failed to parse product or update database:", error);
    throw new Error("Product update failed");
  }
};
