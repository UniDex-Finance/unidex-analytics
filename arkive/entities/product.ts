import { createEntity } from "../deps.ts";
import { BaseData } from "./data.ts";

export interface Product extends BaseData {
  _id: string; // productId:curency:chainId
  createdAtTimestamp: number;
}

export const Product = createEntity<Product>("Product", {
  _id: "string",
  chainId: "number",

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
