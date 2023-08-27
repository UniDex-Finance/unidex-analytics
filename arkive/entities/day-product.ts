import { createEntity } from "../deps.ts";
import { BaseData } from "./data.ts";

export interface DayProduct extends BaseData {
  _id: string; // productId:currency:chainId:dayId

  date: number;
}

export const DayProduct = createEntity<DayProduct>("DayProduct", {
  _id: "string",
  chainId: "number",

  date: {
    type: "number",
    index: true,
  },

  cumulativeFees: {
    type: "number",
    index: true,
  },
  cumulativeFeesUsd: {
    type: "number",
    index: true,
  },
  cumulativePnl: {
    type: "number",
    index: true,
  },
  cumulativePnlUsd: {
    type: "number",
    index: true,
  },
  cumulativeVolume: {
    type: "number",
    index: true,
  },
  cumulativeVolumeUsd: {
    type: "number",
    index: true,
  },
  cumulativeMargin: {
    type: "number",
    index: true,
  },
  cumulativeMarginUsd: {
    type: "number",
    index: true,
  },
  cumulativeLiquidations: {
    type: "number",
    index: true,
  },
  cumulativeLiquidationsUsd: {
    type: "number",
    index: true,
  },

  openInterest: {
    type: "number",
    index: true,
  },
  openInterestUsd: {
    type: "number",
    index: true,
  },
  openInterestLong: {
    type: "number",
    index: true,
  },
  openInterestLongUsd: {
    type: "number",
    index: true,
  },
  openInterestShort: {
    type: "number",
    index: true,
  },
  openInterestShortUsd: {
    type: "number",
    index: true,
  },

  positionCount: {
    type: "number",
    index: true,
  },
  tradeCount: {
    type: "number",
    index: true,
  },
});
