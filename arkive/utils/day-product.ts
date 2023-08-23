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
    `${params.productId}:${params.currency}:${params.chainId}:${dayId}`;
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
          cumulativeFeesUsd: 0,
          cumulativePnl: 0,
          cumulativePnlUsd: 0,
          cumulativeVolume: 0,
          cumulativeVolumeUsd: 0,
          cumulativeMargin: 0,
          cumulativeMarginUsd: 0,
          tradeCount: 0,
        });

        const previousDayProduct = await DayProduct.findOne({
          _id: {
            $regex:
              `^${params.productId}:${params.currency}:${params.chainId}:`,
          },
        }).sort({ date: -1 });
        if (!previousDayProduct) {
          dayProduct.openInterest = dayProduct.openInterestUsd = 0;
          dayProduct.openInterestLong = dayProduct.openInterestLongUsd = 0;
          dayProduct.openInterestShort = dayProduct.openInterestShortUsd = 0;
          dayProduct.positionCount = 0;
        } else {
          dayProduct.openInterest = previousDayProduct.openInterest;
          dayProduct.openInterestUsd = previousDayProduct.openInterestUsd;
          dayProduct.openInterestLong = previousDayProduct.openInterestLong;
          dayProduct.openInterestLongUsd =
            previousDayProduct.openInterestLongUsd;
          dayProduct.openInterestShort = previousDayProduct.openInterestShort;
          dayProduct.openInterestShortUsd =
            previousDayProduct.openInterestShortUsd;
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
