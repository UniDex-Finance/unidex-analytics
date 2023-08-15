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

export const onPositionUpdated: EventHandlerFor<
  typeof TRADING_ABI,
  "PositionUpdated"
> = async (ctx) => {
  const { currency, fee, isLong, key, margin, price, productId, size, user } =
    ctx.event.args;

  const chainId = await getChainId(ctx);

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
  const feeFloat = bigIntToFloat(fee, UNIT_DECIMALS);
  const orderMarginFloat = bigIntToFloat(orderMargin, UNIT_DECIMALS);

  const data = await getData({ currency, store: ctx.store, chainId });
  data.cumulativeFees = data.cumulativeFees + feeFloat;
  data.cumulativeVolume = data.cumulativeVolume + orderSizeFloat;
  data.cumulativeMargin = data.cumulativeMargin + orderMarginFloat;

  const dayData = await getDayData({
    currency,
    store: ctx.store,
    timestamp,
    chainId,
  });
  dayData.cumulativeFees = dayData.cumulativeFees + feeFloat;
  dayData.cumulativeVolume = dayData.cumulativeVolume + orderSizeFloat;
  dayData.cumulativeMargin = dayData.cumulativeMargin + orderMarginFloat;

  const product = await getProduct({
    productId: decodeHexString(productId),
    store: ctx.store,
    currency,
    chainId,
  });
  product.cumulativeFees = product.cumulativeFees + feeFloat;
  product.cumulativeVolume = product.cumulativeVolume + orderSizeFloat;
  product.cumulativeMargin = product.cumulativeMargin + orderMarginFloat;

  if (isNewPosition) {
    data.positionCount = data.positionCount + 1;
    dayData.positionCount = dayData.positionCount + 1;
    product.positionCount = product.positionCount + 1;
  }

  data.openInterest = data.openInterest + orderSizeFloat;
  dayData.openInterest = dayData.openInterest + orderSizeFloat;
  product.openInterest = product.openInterest + orderSizeFloat;

  if (isLong) {
    data.openInterestLong = data.openInterestLong + orderSizeFloat;
    dayData.openInterestLong = dayData.openInterestLong + orderSizeFloat;
    product.openInterestLong = product.openInterestLong + orderSizeFloat;
  } else {
    data.openInterestShort = data.openInterestShort + orderSizeFloat;
    dayData.openInterestShort = dayData.openInterestShort + orderSizeFloat;
    product.openInterestShort = product.openInterestShort + orderSizeFloat;
  }

  savePosition({ store: ctx.store, data: position });
  saveData({ store: ctx.store, data });
  saveDayData({ store: ctx.store, data: dayData });
  saveProduct({ store: ctx.store, data: product });
};
