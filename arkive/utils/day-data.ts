import { Store } from "../deps.ts";
import { DayData } from "../entities/day-data.ts";

export const getDayData = async (
  params: {
    currency: string;
    timestamp: number;
    store: Store;
    chainId: number;
  },
) => {
  const dayId = Math.floor(params.timestamp / 86400);
  const id = `${params.currency}:${dayId}:${params.chainId}`;
  const dayData = await params.store.retrieve(
    `data:${id}`,
    async () => {
      let dayData = await DayData.findOne({ _id: id });
      if (!dayData) {
        dayData = new DayData({
          _id: id,
          chainId: params.chainId,
          date: dayId * 86400,
          cumulativeFees: 0,
          cumulativePnl: 0,
          cumulativeVolume: 0,
          cumulativeMargin: 0,
          tradeCount: 0,
        });

        const previousDayData = await DayData.findOne(
          { _id: `${params.currency}:${dayId - 1}:${params.chainId}` },
        );
        if (!previousDayData) {
          dayData.openInterest = 0;
          dayData.openInterestLong = 0;
          dayData.openInterestShort = 0;
          dayData.positionCount = 0;
        } else {
          dayData.openInterest = previousDayData.openInterest;
          dayData.openInterestLong = previousDayData.openInterestLong;
          dayData.openInterestShort = previousDayData.openInterestShort;
          dayData.positionCount = previousDayData.positionCount;
        }
      }
      return dayData;
    },
  );
  return dayData;
};

export const saveDayData = (params: { store: Store; data: any }) => {
  const { store, data } = params;
  store.set(`data:${data._id}`, data.save());
};
