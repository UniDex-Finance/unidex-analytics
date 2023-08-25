import { TRADING_ABI } from "../abis/Trading.ts";
import { EventHandlerFor } from "../deps.ts";

export const onNewOrder: EventHandlerFor<typeof TRADING_ABI, "NewOrder"> =
  async (ctx) => {
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
  };
