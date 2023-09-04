import { getTimestampFromBlockNumber } from "../deps.ts";
import { onClosePosition } from "../handlers/close-position.ts";
import { onNewOrder } from "../handlers/new-order.ts";
import { onPositionUpdated } from "../handlers/position-updated.ts";
import { getChainId } from "./chainId.ts";

export const getInfo = async (
  ctx: Parameters<
    typeof onPositionUpdated | typeof onClosePosition | typeof onNewOrder
  >[0],
) => {
  const _getInfo = async (i: number) =>
    await Promise.all([
      getChainId(ctx),
      getTimestampFromBlockNumber({
        blockNumber: ctx.event.blockNumber + BigInt(i),
        client: ctx.client,
        store: ctx.store,
      }),
    ]);

  let chainId;
  let timestampMs;
  let i = 0;

  while (true) {
    try {
      const [chainId_, timestampMs_] = await _getInfo(i);
      chainId = chainId_;
      timestampMs = timestampMs_;
      break;
    } catch (e) {
      ctx.logger.warning(e);
      await new Promise((r) => setTimeout(r, 5000 + i));
      i++;
    }
  }

  return { chainId, timestampMs };
};
