import { TRADING_V2_ABI } from "../abis/TradingV2.ts";
import { bigIntToFloat, EventHandlerFor, hexToString } from "../deps.ts";
import { Order } from "../entities/order.ts";
import { UNIT_DECIMALS } from "../utils/constants.ts";
import { getInfo } from "../utils/info.ts";

export const onNewOrder: EventHandlerFor<typeof TRADING_V2_ABI, "NewOrder"> =
  async (
    ctx,
  ) => {
    const {
      currency,
      isClose,
      isLong,
      key,
      limitPrice,
      margin,
      productId,
      referral,
      size,
      user,
    } = ctx.event.args;

    const { chainId, timestampMs } = await getInfo(ctx);

    await Order.updateOne({ _id: `${key}:${chainId}` }, {
      $setOnInsert: {
        chainId,
        productId: hexToString(productId, { size: 32 }),
        user,
        currency,
        isLong,
        createdAtTimestamp: timestampMs / 1000,
        createdAtBlockNumber: Number(ctx.event.blockNumber),
      },
      $set: {
        margin: bigIntToFloat(margin, UNIT_DECIMALS),
        limitPrice: hexToString(limitPrice, { size: 32 }),
        referral,
        size: bigIntToFloat(size, UNIT_DECIMALS),
        isClose,
        isOpen: true,
        updatedAtTimestamp: timestampMs / 1000,
        updatedAtBlockNumber: Number(ctx.event.blockNumber),
      },
    }, { upsert: true });
  };
