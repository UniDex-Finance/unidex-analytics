import { Store } from "../deps.ts";
import { Data } from "../entities/data.ts";

export const getData = async (
  params: {
    currency: string;
    store: Store;
    chainId: number;
    timestamp: number;
  },
) => {
  const { store, currency, chainId, timestamp } = params;
  const id = `${currency}:${chainId}`;
  const data = await store.retrieve(`data:${id}`, async () => {
    const data = await Data.findOne({ _id: id });
    if (!data) {
      return new Data({
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
    return data;
  });
  return data;
};

export const saveData = (params: { store: Store; data: any }) => {
  const { store, data } = params;
  store.set(`data:${data._id}`, data.save());
};
