import { EventHandlerFor } from "../deps.ts";
import { TRADING_ABI } from "../abis/Trading.ts";

export const onPositionUpdated: EventHandlerFor<
  typeof TRADING_ABI,
  "PositionUpdated"
> = async (ctx) => {
};
