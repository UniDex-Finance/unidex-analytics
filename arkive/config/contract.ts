import { TRADING_V2_ABI } from "../abis/TradingV2.ts";
import { eventHandlers } from "./handlers.ts";

export const createTradingContractConfig = (
  sources: Record<string, bigint>,
) => ({
  name: "Trading",
  abi: TRADING_V2_ABI,
  // deno-lint-ignore no-explicit-any
  sources: sources as any,
  eventHandlers,
});
