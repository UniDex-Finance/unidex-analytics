import { Store } from "../deps.ts";
import { Product } from "../entities/product.ts";

export const getProduct = async (
  params: {
    productId: string;
    currency: string;
    store: Store;
    chainId: number;
    timestamp: number;
  },
) => {
  const { store, currency, productId, chainId, timestamp } = params;
  const id = `${productId}:${currency}:${chainId}`;
  const product = await store.retrieve(
    `product:${id}`,
    async () => {
      const product = await Product.findOne({ _id: id });
      if (!product) {
        return new Product({
          _id: id,
          chainId,
          cumulativeFees: 0,
          cumulativeFeesUsd: 0,
          cumulativePnl: 0,
          cumulativePnlUsd: 0,
          cumulativeVolume: 0,
          cumulativeVolumeUsd: 0,
          cumulativeMargin: 0,
          cumulativeMarginUsd: 0,
          cumulativeLiquidations: 0,
          cumulativeLiquidationsUsd: 0,
          openInterest: 0,
          openInterestUsd: 0,
          openInterestLong: 0,
          openInterestLongUsd: 0,
          openInterestShort: 0,
          openInterestShortUsd: 0,
          positionCount: 0,
          tradeCount: 0,
          createdAtTimestamp: timestamp,
        });
      }
      return product;
    },
  );
  return product;
};

export const saveProduct = (params: { store: Store; data: any }) => {
  const { store, data } = params;
  store.set(`product:${data._id}`, data.save());
};
