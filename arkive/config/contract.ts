import { TRADING_ABI } from "../abis/Trading.ts";
import { eventHandlers } from "./handlers.ts";

export const createTradingContractConfig = (
  sources: Record<string, bigint>,
) => ({
  name: "Trading",
  abi: TRADING_ABI,
  sources: sources as any,
  eventHandlers,
});
