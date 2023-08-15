import { Store } from "../deps.ts";
import { Product } from "../entities/product.ts";

export const getProduct = async (
  params: {
    productId: string;
    currency: string;
    store: Store;
    chainId: number;
  },
) => {
  const { store, currency, productId, chainId } = params;
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
          cumulativePnl: 0,
          cumulativeVolume: 0,
          cumulativeMargin: 0,
          openInterest: 0,
          openInterestLong: 0,
          openInterestShort: 0,
          positionCount: 0,
          tradeCount: 0,
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
