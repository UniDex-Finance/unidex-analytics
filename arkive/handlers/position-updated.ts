import { bigIntToFloat, EventHandlerFor } from "../deps.ts";
import { UNIT_DECIMALS } from "../utils/constants.ts";
import { getPosition, savePosition } from "../utils/position.ts";
import { getProduct, saveProduct } from "../utils/product.ts";
import { decodeHexString } from "../utils/decoder.ts";
import { getPrice } from "../utils/prices.ts";
import { chainIdToCoingeckoId } from "../config/coingecko-networks.ts";
import { getDayProduct, saveDayProduct } from "../utils/day-product.ts";
import { User } from "../entities/user.ts";
import { TRADING_V2_ABI } from "../abis/TradingV2.ts";
import { getInfo } from "../utils/info.ts";
import { Order } from "../entities/order.ts";

export const onPositionUpdated: EventHandlerFor<
  typeof TRADING_V2_ABI,
  "PositionUpdated"
> = async (ctx) => {
  const { currency, fee, isLong, key, margin, price, productId, size, user } =
    ctx.event.args;

  const { chainId, timestampMs } = await getInfo(ctx);

  const timestamp = timestampMs / 1000;

  const decodedProductId = decodeHexString(productId);

  const [collateralPrice, positionInfo, product, dayProduct] = await Promise
    .all([
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
    product.positionCount = product.positionCount + 1;
    dayProduct.positionCount = dayProduct.positionCount + 1;
  }

  product.openInterest = product.openInterest + orderSizeFloat;
  product.openInterestUsd = product.openInterest * (collateralPrice || 0);
  dayProduct.openInterest = dayProduct.openInterest + orderSizeFloat;
  dayProduct.openInterestUsd = dayProduct.openInterest * (collateralPrice || 0);

  if (isLong) {
    product.openInterestLong = product.openInterestLong + orderSizeFloat;
    product.openInterestLongUsd = product.openInterestLong *
      (collateralPrice || 0);
    dayProduct.openInterestLong = dayProduct.openInterestLong + orderSizeFloat;
    dayProduct.openInterestLongUsd = dayProduct.openInterestLong *
      (collateralPrice || 0);
  } else {
    product.openInterestShort = product.openInterestShort + orderSizeFloat;
    product.openInterestShortUsd = product.openInterestShort *
      (collateralPrice || 0);
    dayProduct.openInterestShort = dayProduct.openInterestShort +
      orderSizeFloat;
    dayProduct.openInterestShortUsd = dayProduct.openInterestShort *
      (collateralPrice || 0);
  }

  User.updateOne(
    { _id: user },
    {
      $set: {
        updatedAtTimestamp: timestamp,
        updatedAtBlockNumber: Number(ctx.event.blockNumber),
      },
      $setOnInsert: {
        createdAtTimestamp: timestamp,
        createdAtBlockNumber: Number(ctx.event.blockNumber),
      },
    },
    { upsert: true },
  ).then(() => {});

  Order.updateOne({
    _id: `${key}:${chainId}`,
    isClose: false,
  }, {
    $set: {
      isOpen: false,
      updatedAtTimestamp: timestamp,
      updatedAtBlockNumber: Number(ctx.event.blockNumber),
    },
  });

  savePosition({ store: ctx.store, data: position });
  saveProduct({ store: ctx.store, data: product });
  saveDayProduct({ store: ctx.store, data: dayProduct });
};
