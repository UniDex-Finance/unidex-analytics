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

    await Order.create({
      _id: `${key}:${chainId}`,
      chainId,
      productId: hexToString(productId, { size: 32 }),
      margin: bigIntToFloat(margin, UNIT_DECIMALS),
      limitPrice: hexToString(limitPrice, { size: 32 }),
      referral,
      size: bigIntToFloat(size, UNIT_DECIMALS),
      user,
      currency,
      isLong,
      isClose,
      isOpen: true,
      createdAtTimestamp: timestampMs / 1000,
      createdAtBlockNumber: ctx.event.blockNumber,
      updatedAtTimestamp: timestampMs / 1000,
      updatedAtBlockNumber: ctx.event.blockNumber,
    });
  };
