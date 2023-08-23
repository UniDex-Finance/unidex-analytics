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
  const id = `${params.currency}:${params.chainId}:${dayId}`;
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
          cumulativeFeesUsd: 0,
          cumulativePnl: 0,
          cumulativePnlUsd: 0,
          cumulativeVolume: 0,
          cumulativeVolumeUsd: 0,
          cumulativeMargin: 0,
          cumulativeMarginUsd: 0,
          tradeCount: 0,
        });

        const previousDayData = await DayData.findOne({
          _id: {
            $regex: `^${params.currency}:${params.chainId}:`,
          },
        }).sort({ date: -1 });
        if (!previousDayData) {
          dayData.openInterest = dayData.openInterestUsd = 0;
          dayData.openInterestLong = dayData.openInterestLongUsd = 0;
          dayData.openInterestShort = dayData.openInterestShortUsd = 0;
          dayData.positionCount = 0;
        } else {
          dayData.openInterest = previousDayData.openInterest;
          dayData.openInterestUsd = previousDayData.openInterestUsd;
          dayData.openInterestLong = previousDayData.openInterestLong;
          dayData.openInterestLongUsd = previousDayData.openInterestLongUsd;
          dayData.openInterestShort = previousDayData.openInterestShort;
          dayData.openInterestShortUsd = previousDayData.openInterestShortUsd;
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
