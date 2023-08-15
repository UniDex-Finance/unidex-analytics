import { onClosePosition } from "../handlers/close-position.ts";
import { onPositionUpdated } from "../handlers/position-updated.ts";

export const eventHandlers = {
  PositionUpdated: onPositionUpdated,
  ClosePosition: onClosePosition,
};
