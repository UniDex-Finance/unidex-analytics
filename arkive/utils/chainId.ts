import { onClosePosition } from "../handlers/close-position.ts";
import { onPositionUpdated } from "../handlers/position-updated.ts";

export const getChainId = async (
  ctx: Parameters<typeof onPositionUpdated | typeof onClosePosition>[0],
) => {
  const { store, client } = ctx;

  const chainId = await store.retrieve(
    "chainId",
    client.getChainId,
  );

  return chainId;
};
