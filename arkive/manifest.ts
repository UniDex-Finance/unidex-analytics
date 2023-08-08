import { TRADING_ABI } from "./abis/Trading.ts";
import { Manifest } from "./deps.ts";
import { onClosePosition } from "./handlers/close-position.ts";
import { onPositionUpdated } from "./handlers/position-updated.ts";

export default new Manifest("unidex")
  .addChain("arbitrum", (chain) =>
    chain
      .addContract({
        name: "Trading",
        abi: TRADING_ABI,
        sources: {
          "0x7D9c9B6861168b2fB180deE065f7F5dF601cd234": 105901387n,
        },
        eventHandlers: {
          PositionUpdated: onPositionUpdated,
          ClosePosition: onClosePosition,
        },
      }))
  .build();
