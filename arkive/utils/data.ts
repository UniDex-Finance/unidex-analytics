import { Store } from "../deps.ts";
import { Data } from "../entities/data.ts";

export const getData = async (
  params: { currency: string; store: Store; chainId: number },
) => {
  const { store, currency, chainId } = params;
  const id = `${currency}:${chainId}`;
  const data = await store.retrieve(`data:${id}`, async () => {
    const data = await Data.findOne({ _id: id });
    if (!data) {
      return new Data({
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
    return data;
  });
  return data;
};

export const saveData = (params: { store: Store; data: any }) => {
  const { store, data } = params;
  store.set(`data:${data._id}`, data.save());
};
