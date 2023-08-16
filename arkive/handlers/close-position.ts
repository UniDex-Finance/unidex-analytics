import {
  bigIntToFloat,
  EventHandlerFor,
  getTimestampFromBlockNumber,
} from "../deps.ts";
import { TRADING_ABI } from "../abis/Trading.ts";
import { getPosition, savePosition } from "../utils/position.ts";
import { getData, saveData } from "../utils/data.ts";
import { getDayData, saveDayData } from "../utils/day-data.ts";
import { getProduct, saveProduct } from "../utils/product.ts";
import { Trade } from "../entities/trade.ts";
import { UNIT_DECIMALS } from "../utils/constants.ts";
import { getChainId } from "../utils/chainId.ts";
import { decodeHexString } from "../utils/decoder.ts";

export const onClosePosition: EventHandlerFor<
  typeof TRADING_ABI,
  "ClosePosition"
> = async (ctx) => {
  const {
    currency,
    fee,
    key,
    margin,
    price,
    productId,
    size,
    user,
    pnl,
    wasLiquidated,
  } = ctx.event.args;

  const chainId = await getChainId(ctx);

  const marginFloat = bigIntToFloat(margin, UNIT_DECIMALS);
  const feeFloat = bigIntToFloat(fee, UNIT_DECIMALS);
  const sizeFloat = bigIntToFloat(size, UNIT_DECIMALS);
  const pnlFloat = bigIntToFloat(pnl, UNIT_DECIMALS);
  const priceFloat = bigIntToFloat(price, UNIT_DECIMALS);

  const timestamp = await getTimestampFromBlockNumber({
    blockNumber: ctx.event.blockNumber,
    client: ctx.client,
    store: ctx.store,
  });

  const { position, isNewPosition } = await getPosition({
    key,
    store: ctx.store,
    chainId,
    productId: decodeHexString(productId),
  });

  if (isNewPosition) return;

  const data = await getData({ currency, store: ctx.store, chainId });

  const dayData = await getDayData({
    currency,
    store: ctx.store,
    timestamp,
    chainId,
  });
  const product = await getProduct({
    productId: decodeHexString(productId),
    store: ctx.store,
    currency,
    chainId,
  });

  data.tradeCount = data.tradeCount + 1;

  const isFullClose =
    bigIntToFloat(margin + fee, UNIT_DECIMALS) === position.margin;

  const trade = new Trade({
    _id: `${chainId}:${currency}:${data.tradeCount}`,
    chainId,
    positionKey: key,
    txHash: ctx.event.transactionHash,
    productId: decodeHexString(productId),
    leverage: position.leverage,
    size: sizeFloat,
    entryPrice: position.price,
    closePrice: priceFloat,
    margin: marginFloat,
    user,
    currency: position.currency,
    fee: feeFloat,
    pnl: pnlFloat,
    wasLiquidated,
    isFullClose,
    isLong: position.isLong,
    duration: timestamp - position.createdAtTimestamp,
    blockNumber: Number(ctx.event.blockNumber),
    timestamp,
  });

  if (isFullClose) {
    await position.deleteOne();
    ctx.store.delete(`position:${key}:${chainId}`);
    data.positionCount = data.positionCount - 1;
    product.positionCount = product.positionCount - 1;
    dayData.positionCount = dayData.positionCount - 1;
  } else {
    position.margin = position.margin - marginFloat;
    -feeFloat;
    position.size = position.size - sizeFloat;
    savePosition({ store: ctx.store, data: position });
  }

  data.cumulativePnl = data.cumulativePnl + pnlFloat;
  data.cumulativeFees = data.cumulativeFees + feeFloat;
  data.cumulativeVolume = data.cumulativeVolume + sizeFloat;
  data.cumulativeMargin = data.cumulativeMargin + marginFloat;
  // data.tradeCount = data.tradeCount + 1;

  dayData.cumulativePnl = dayData.cumulativePnl + pnlFloat;
  dayData.cumulativeFees = dayData.cumulativeFees + feeFloat;
  dayData.cumulativeVolume = dayData.cumulativeVolume + sizeFloat;
  dayData.cumulativeMargin = dayData.cumulativeMargin + marginFloat;
  dayData.tradeCount = dayData.tradeCount + 1;

  product.cumulativePnl = product.cumulativePnl + pnlFloat;
  product.cumulativeFees = product.cumulativeFees + feeFloat;
  product.cumulativeVolume = product.cumulativeVolume + sizeFloat;
  product.cumulativeMargin = product.cumulativeMargin + marginFloat;
  product.tradeCount = product.tradeCount + 1;

  data.openInterest = data.openInterest - sizeFloat;
  dayData.openInterest = dayData.openInterest - sizeFloat;
  product.openInterest = product.openInterest - sizeFloat;

  if (position.isLong) {
    data.openInterestLong = data.openInterestLong - sizeFloat;
    dayData.openInterestLong = dayData.openInterestLong - sizeFloat;
    product.openInterestLong = product.openInterestLong - sizeFloat;
  } else {
    data.openInterestShort = data.openInterestShort - sizeFloat;
    dayData.openInterestShort = dayData.openInterestShort - sizeFloat;
    product.openInterestShort = product.openInterestShort - sizeFloat;
  }

  trade.save();
  saveData({ store: ctx.store, data });
  saveDayData({ store: ctx.store, data: dayData });
  saveProduct({ store: ctx.store, data: product });
};
