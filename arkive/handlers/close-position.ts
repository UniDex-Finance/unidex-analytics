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
import { getDayProduct, saveDayProduct } from "../utils/day-product.ts";
import { getPrice } from "../utils/prices.ts";
import { chainIdToCoingeckoId } from "../config/coingecko-networks.ts";

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

  const [chainId, timestampMs] = await Promise.all([
    getChainId(ctx),
    getTimestampFromBlockNumber({
      blockNumber: ctx.event.blockNumber,
      client: ctx.client,
      store: ctx.store,
    }),
  ]);

  const decodedProductId = decodeHexString(productId);

  const { position, isNewPosition } = await getPosition({
    key,
    store: ctx.store,
    chainId,
    productId: decodedProductId,
  });

  if (isNewPosition) return;

  const timestamp = timestampMs / 1000;

  const [data, dayData, product, dayProduct, collateralPrice] = await Promise
    .all([
      getData({
        currency,
        store: ctx.store,
        chainId,
        timestamp,
      }),
      getDayData({
        currency,
        store: ctx.store,
        timestamp,
        chainId,
      }),
      getProduct({
        productId: decodeHexString(productId),
        store: ctx.store,
        currency,
        chainId,
        timestamp,
      }),
      getDayProduct({
        chainId,
        currency,
        productId: decodedProductId,
        store: ctx.store,
        timestamp,
      }),
      getPrice({
        chainId: chainId as keyof typeof chainIdToCoingeckoId,
        currency,
        timestamp,
        store: ctx.store,
      }),
    ]);

  const marginFloat = bigIntToFloat(margin, UNIT_DECIMALS);
  const marginUsd = marginFloat * (collateralPrice || 0);
  const feeFloat = bigIntToFloat(fee, UNIT_DECIMALS);
  const feeUsd = feeFloat * (collateralPrice || 0);
  const sizeFloat = bigIntToFloat(size, UNIT_DECIMALS);
  const sizeUsd = sizeFloat * (collateralPrice || 0);
  const pnlFloat = bigIntToFloat(pnl, UNIT_DECIMALS);
  const pnlUsd = pnlFloat * (collateralPrice || 0);
  const priceFloat = bigIntToFloat(price, UNIT_DECIMALS);

  data.tradeCount = data.tradeCount + 1;

  const isFullClose =
    bigIntToFloat(margin + fee, UNIT_DECIMALS) === position.margin;

  const trade = new Trade({
    _id: `${data.tradeCount}:${currency}:${chainId}`,
    chainId,
    positionKey: key,
    txHash: ctx.event.transactionHash,
    productId: decodedProductId,
    leverage: position.leverage,
    size: sizeFloat,
    sizeUsd,
    entryPrice: position.price,
    closePrice: priceFloat,
    margin: marginFloat,
    marginUsd,
    user,
    currency: position.currency,
    fee: feeFloat,
    feeUsd,
    pnl: pnlFloat,
    pnlUsd,
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
    dayProduct.positionCount = dayProduct.positionCount - 1;
  } else {
    position.margin = position.margin - marginFloat;
    -feeFloat;
    position.size = position.size - sizeFloat;
    savePosition({ store: ctx.store, data: position });
  }

  data.cumulativePnl = data.cumulativePnl + pnlFloat;
  data.cumulativePnlUsd = data.cumulativePnlUsd + pnlUsd;
  data.cumulativeFees = data.cumulativeFees + feeFloat;
  data.cumulativeFeesUsd = data.cumulativeFeesUsd + feeUsd;
  data.cumulativeVolume = data.cumulativeVolume + sizeFloat;
  data.cumulativeVolumeUsd = data.cumulativeVolumeUsd + sizeUsd;
  data.cumulativeMargin = data.cumulativeMargin + marginFloat;
  data.cumulativeMarginUsd = data.cumulativeMarginUsd + marginUsd;
  // data.tradeCount = data.tradeCount + 1;

  dayData.cumulativePnl = dayData.cumulativePnl + pnlFloat;
  dayData.cumulativePnlUsd = dayData.cumulativePnlUsd + pnlUsd;
  dayData.cumulativeFees = dayData.cumulativeFees + feeFloat;
  dayData.cumulativeFeesUsd = dayData.cumulativeFeesUsd + feeUsd;
  dayData.cumulativeVolume = dayData.cumulativeVolume + sizeFloat;
  dayData.cumulativeVolumeUsd = dayData.cumulativeVolumeUsd + sizeUsd;
  dayData.cumulativeMargin = dayData.cumulativeMargin + marginFloat;
  dayData.cumulativeMarginUsd = dayData.cumulativeMarginUsd + marginUsd;
  dayData.tradeCount = dayData.tradeCount + 1;

  product.cumulativePnl = product.cumulativePnl + pnlFloat;
  product.cumulativePnlUsd = product.cumulativePnlUsd + pnlUsd;
  product.cumulativeFees = product.cumulativeFees + feeFloat;
  product.cumulativeFeesUsd = product.cumulativeFeesUsd + feeUsd;
  product.cumulativeVolume = product.cumulativeVolume + sizeFloat;
  product.cumulativeVolumeUsd = product.cumulativeVolumeUsd + sizeUsd;
  product.cumulativeMargin = product.cumulativeMargin + marginFloat;
  product.cumulativeMarginUsd = product.cumulativeMarginUsd + marginUsd;
  product.tradeCount = product.tradeCount + 1;

  dayProduct.cumulativePnl = dayProduct.cumulativePnl + pnlFloat;
  dayProduct.cumulativePnlUsd = dayProduct.cumulativePnlUsd + pnlUsd;
  dayProduct.cumulativeFees = dayProduct.cumulativeFees + feeFloat;
  dayProduct.cumulativeFeesUsd = dayProduct.cumulativeFeesUsd + feeUsd;
  dayProduct.cumulativeVolume = dayProduct.cumulativeVolume + sizeFloat;
  dayProduct.cumulativeVolumeUsd = dayProduct.cumulativeVolumeUsd + sizeUsd;
  dayProduct.cumulativeMargin = dayProduct.cumulativeMargin + marginFloat;
  dayProduct.cumulativeMarginUsd = dayProduct.cumulativeMarginUsd + marginUsd;
  dayProduct.tradeCount = dayProduct.tradeCount + 1;

  data.openInterest = data.openInterest - sizeFloat;
  data.openInterestUsd = data.openInterest * (collateralPrice || 0);
  dayData.openInterest = dayData.openInterest - sizeFloat;
  dayData.openInterestUsd = dayData.openInterest * (collateralPrice || 0);
  product.openInterest = product.openInterest - sizeFloat;
  product.openInterestUsd = product.openInterest * (collateralPrice || 0);
  dayProduct.openInterest = dayProduct.openInterest - sizeFloat;
  dayProduct.openInterestUsd = dayProduct.openInterest * (collateralPrice || 0);

  if (position.isLong) {
    data.openInterestLong = data.openInterestLong - sizeFloat;
    data.openInterestLongUsd = data.openInterestLong * (collateralPrice || 0);
    dayData.openInterestLong = dayData.openInterestLong - sizeFloat;
    dayData.openInterestLongUsd = dayData.openInterestLong *
      (collateralPrice || 0);
    product.openInterestLong = product.openInterestLong - sizeFloat;
    product.openInterestLongUsd = product.openInterestLong *
      (collateralPrice || 0);
    dayProduct.openInterestLong = dayProduct.openInterestLong - sizeFloat;
    dayProduct.openInterestLongUsd = dayProduct.openInterestLong *
      (collateralPrice || 0);
  } else {
    data.openInterestShort = data.openInterestShort - sizeFloat;
    data.openInterestShortUsd = data.openInterestShort * (collateralPrice || 0);
    dayData.openInterestShort = dayData.openInterestShort - sizeFloat;
    dayData.openInterestShortUsd = dayData.openInterestShort *
      (collateralPrice || 0);
    product.openInterestShort = product.openInterestShort - sizeFloat;
    product.openInterestShortUsd = product.openInterestShort *
      (collateralPrice || 0);
    dayProduct.openInterestShort = dayProduct.openInterestShort - sizeFloat;
    dayProduct.openInterestShortUsd = dayProduct.openInterestShort *
      (collateralPrice || 0);
  }

  trade.save();
  saveData({ store: ctx.store, data });
  saveDayData({ store: ctx.store, data: dayData });
  saveProduct({ store: ctx.store, data: product });
  saveDayProduct({ store: ctx.store, data: dayProduct });
};
