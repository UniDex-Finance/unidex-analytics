import {
  bigIntToFloat,
  EventHandlerFor,
  getTimestampFromBlockNumber,
} from "../deps.ts";
import { TRADING_ABI } from "../abis/Trading.ts";
import { UNIT_DECIMALS } from "../utils/constants.ts";
import { getPosition, savePosition } from "../utils/position.ts";
import { getData, saveData } from "../utils/data.ts";
import { getDayData, saveDayData } from "../utils/day-data.ts";
import { getProduct, saveProduct } from "../utils/product.ts";
import { getChainId } from "../utils/chainId.ts";
import { decodeHexString } from "../utils/decoder.ts";
import { getPrice } from "../utils/prices.ts";
import { chainIdToCoingeckoId } from "../config/coingecko-networks.ts";
import { getDayProduct, saveDayProduct } from "../utils/day-product.ts";

export const onPositionUpdated: EventHandlerFor<
  typeof TRADING_ABI,
  "PositionUpdated"
> = async (ctx) => {
  const { currency, fee, isLong, key, margin, price, productId, size, user } =
    ctx.event.args;

  const getInfo = async () =>
    await Promise.all([
      getChainId(ctx),
      getTimestampFromBlockNumber({
        blockNumber: ctx.event.blockNumber,
        client: ctx.client,
        store: ctx.store,
      }),
    ]);

  let chainId;
  let timestampMs;

  while (true) {
    try {
      const [chainId_, timestampMs_] = await getInfo();
      chainId = chainId_;
      timestampMs = timestampMs_;
      break;
    } catch (e) {
      ctx.logger.error(e);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  const timestamp = timestampMs / 1000;

  const decodedProductId = decodeHexString(productId);

  const [collateralPrice, positionInfo, data, dayData, product, dayProduct] =
    await Promise.all([
      getPrice({
        currency,
        chainId: chainId as keyof typeof chainIdToCoingeckoId,
        timestamp,
        store: ctx.store,
      }),
      getPosition({
        key,
        store: ctx.store,
        chainId,
        productId: decodedProductId,
      }),
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
        productId: decodedProductId,
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
    ]);

  const { position, isNewPosition } = positionInfo;

  const orderSize = size - BigInt(parseInt((position.size * 1e8).toString()));
  const orderMargin = margin -
    BigInt(parseInt((position.margin * 1e8).toString()));

  position.productId = decodeHexString(productId);
  position.price = bigIntToFloat(price, UNIT_DECIMALS);
  position.margin = bigIntToFloat(margin, UNIT_DECIMALS);
  position.size = bigIntToFloat(size, UNIT_DECIMALS);

  const leverage = size * (10n ** 8n) / margin;

  position.leverage = bigIntToFloat(leverage, 8n);

  position.user = user;
  position.currency = currency;

  position.fee = position.fee + bigIntToFloat(fee, UNIT_DECIMALS);
  position.isLong = isLong;

  position.updatedAtTimestamp = timestamp;
  position.updatedAtBlockNumber = Number(ctx.event.blockNumber);

  let liquidationPrice = 0n;
  const liquidationThreshold = 9000n;

  if (isLong) {
    liquidationPrice = price -
      (price * liquidationThreshold * 10000n / leverage);
  } else {
    liquidationPrice = price +
      (price * liquidationThreshold * 10000n / leverage);
  }

  position.liquidationPrice = bigIntToFloat(liquidationPrice, UNIT_DECIMALS);

  const orderSizeFloat = bigIntToFloat(orderSize, UNIT_DECIMALS);
  const orderSizeUsd = orderSizeFloat * (collateralPrice || 0);
  const feeFloat = bigIntToFloat(fee, UNIT_DECIMALS);
  const feeUsd = feeFloat * (collateralPrice || 0);
  const orderMarginFloat = bigIntToFloat(orderMargin, UNIT_DECIMALS);
  const orderMarginUsd = orderMarginFloat * (collateralPrice || 0);

  data.cumulativeFees = data.cumulativeFees + feeFloat;
  data.cumulativeFeesUsd = data.cumulativeFeesUsd + feeUsd;
  data.cumulativeVolume = data.cumulativeVolume + orderSizeFloat;
  data.cumulativeVolumeUsd = data.cumulativeVolumeUsd + orderSizeUsd;
  data.cumulativeMargin = data.cumulativeMargin + orderMarginFloat;
  data.cumulativeMarginUsd = data.cumulativeMarginUsd + orderMarginUsd;

  dayData.cumulativeFees = dayData.cumulativeFees + feeFloat;
  dayData.cumulativeFeesUsd = dayData.cumulativeFeesUsd + feeUsd;
  dayData.cumulativeVolume = dayData.cumulativeVolume + orderSizeFloat;
  dayData.cumulativeVolumeUsd = dayData.cumulativeVolumeUsd + orderSizeUsd;
  dayData.cumulativeMargin = dayData.cumulativeMargin + orderMarginFloat;
  dayData.cumulativeMarginUsd = dayData.cumulativeMarginUsd + orderMarginUsd;

  product.cumulativeFees = product.cumulativeFees + feeFloat;
  product.cumulativeFeesUsd = product.cumulativeFeesUsd + feeUsd;
  product.cumulativeVolume = product.cumulativeVolume + orderSizeFloat;
  product.cumulativeVolumeUsd = product.cumulativeVolumeUsd + orderSizeUsd;
  product.cumulativeMargin = product.cumulativeMargin + orderMarginFloat;
  product.cumulativeMarginUsd = product.cumulativeMarginUsd + orderMarginUsd;

  dayProduct.cumulativeFees = dayProduct.cumulativeFees + feeFloat;
  dayProduct.cumulativeFeesUsd = dayProduct.cumulativeFeesUsd + feeUsd;
  dayProduct.cumulativeVolume = dayProduct.cumulativeVolume + orderSizeFloat;
  dayProduct.cumulativeVolumeUsd = dayProduct.cumulativeVolumeUsd +
    orderSizeUsd;
  dayProduct.cumulativeMargin = dayProduct.cumulativeMargin + orderMarginFloat;
  dayProduct.cumulativeMarginUsd = dayProduct.cumulativeMarginUsd +
    orderMarginUsd;

  if (isNewPosition) {
    position.createdAtTimestamp = timestamp;
    position.createdAtBlockNumber = Number(ctx.event.blockNumber);
    data.positionCount = data.positionCount + 1;
    dayData.positionCount = dayData.positionCount + 1;
    product.positionCount = product.positionCount + 1;
    dayProduct.positionCount = dayProduct.positionCount + 1;
  }

  data.openInterest = data.openInterest + orderSizeFloat;
  data.openInterestUsd = data.openInterestUsd + orderSizeUsd;
  dayData.openInterest = dayData.openInterest + orderSizeFloat;
  dayData.openInterestUsd = dayData.openInterestUsd + orderSizeUsd;
  product.openInterest = product.openInterest + orderSizeFloat;
  product.openInterestUsd = product.openInterestUsd + orderSizeUsd;
  dayProduct.openInterest = dayProduct.openInterest + orderSizeFloat;
  dayProduct.openInterestUsd = dayProduct.openInterestUsd + orderSizeUsd;

  if (isLong) {
    data.openInterestLong = data.openInterestLong + orderSizeFloat;
    data.openInterestLongUsd = data.openInterestLongUsd + orderSizeUsd;
    dayData.openInterestLong = dayData.openInterestLong + orderSizeFloat;
    dayData.openInterestLongUsd = dayData.openInterestLongUsd + orderSizeUsd;
    product.openInterestLong = product.openInterestLong + orderSizeFloat;
    product.openInterestLongUsd = product.openInterestLongUsd + orderSizeUsd;
    dayProduct.openInterestLong = dayProduct.openInterestLong + orderSizeFloat;
    dayProduct.openInterestLongUsd = dayProduct.openInterestLongUsd +
      orderSizeUsd;
  } else {
    data.openInterestShort = data.openInterestShort + orderSizeFloat;
    data.openInterestShortUsd = data.openInterestShortUsd + orderSizeUsd;
    dayData.openInterestShort = dayData.openInterestShort + orderSizeFloat;
    dayData.openInterestShortUsd = dayData.openInterestShortUsd + orderSizeUsd;
    product.openInterestShort = product.openInterestShort + orderSizeFloat;
    product.openInterestShortUsd = product.openInterestShortUsd + orderSizeUsd;
    dayProduct.openInterestShort = dayProduct.openInterestShort +
      orderSizeFloat;
    dayProduct.openInterestShortUsd = dayProduct.openInterestShortUsd +
      orderSizeUsd;
  }

  savePosition({ store: ctx.store, data: position });
  saveData({ store: ctx.store, data });
  saveDayData({ store: ctx.store, data: dayData });
  saveProduct({ store: ctx.store, data: product });
  saveDayProduct({ store: ctx.store, data: dayProduct });
};
