import { Store } from "../deps.ts";
import { DayProduct } from "../entities/day-product.ts";

export const getDayProduct = async (
  params: {
    productId: string;
    currency: string;
    timestamp: number;
    store: Store;
    chainId: number;
  },
) => {
  const dayId = Math.floor(params.timestamp / 86400);
  const id =
    `${params.productId}:${params.currency}:${dayId}:${params.chainId}`;
  const dayProduct = await params.store.retrieve(
    `product:${id}`,
    async () => {
      let dayProduct = await DayProduct.findOne({ _id: id });
      if (!dayProduct) {
        dayProduct = new DayProduct({
          _id: id,
          chainId: params.chainId,
          date: dayId * 86400,
          cumulativeFees: 0,
          cumulativePnl: 0,
          cumulativeVolume: 0,
          cumulativeMargin: 0,
          tradeCount: 0,
        });

        const previousDayProduct = await DayProduct.findOne(
          {
            _id: `${params.productId}:${params.currency}:${
              dayId - 1
            }:${params.chainId}`,
          },
        );
        if (!previousDayProduct) {
          dayProduct.openInterest = 0;
          dayProduct.openInterestLong = 0;
          dayProduct.openInterestShort = 0;
          dayProduct.positionCount = 0;
        } else {
          dayProduct.openInterest = previousDayProduct.openInterest;
          dayProduct.openInterestLong = previousDayProduct.openInterestLong;
          dayProduct.openInterestShort = previousDayProduct.openInterestShort;
          dayProduct.positionCount = previousDayProduct.positionCount;
        }
      }
      return dayProduct;
    },
  );
  return dayProduct;
};

export const saveDayProduct = (params: { store: Store; data: any }) => {
  const { store, data } = params;
  store.set(`product:${data._id}`, data.save());
};
