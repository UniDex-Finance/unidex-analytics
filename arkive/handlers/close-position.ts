import { EventHandlerFor } from "../deps.ts";
import { TRADING_ABI } from "../abis/Trading.ts";

export const onClosePosition: EventHandlerFor<
  typeof TRADING_ABI,
  "ClosePosition"
> = async (ctx) => {
};
