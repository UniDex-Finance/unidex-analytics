import { encodeEventTopics, parseAbiItem } from "npm:viem";
import { TRADING_ABI } from "./abis/Trading.ts";

console.log(
  encodeEventTopics({ abi: TRADING_ABI, eventName: "PositionUpdated" }),
);
