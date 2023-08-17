import { createEntity } from "../deps.ts";

export interface Product {
  _id: string;
  chainId: number;

  cumulativeFees: number;
  cumulativePnl: number;
  cumulativeVolume: number;
  cumulativeMargin: number;

  positionCount: number;
  tradeCount: number;

  openInterest: number;
  openInterestLong: number;
  openInterestShort: number;
}

export const Product = createEntity<Product>("Product", {
  _id: "string",
  chainId: "number",

  cumulativeFees: {
    type: "number",
    index: true,
  },
  cumulativePnl: {
    type: "number",
    index: true,
  },
  cumulativeVolume: {
    type: "number",
    index: true,
  },
  cumulativeMargin: {
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

  openInterest: {
    type: "number",
    index: true,
  },
  openInterestLong: {
    type: "number",
    index: true,
  },
  openInterestShort: {
    type: "number",
    index: true,
  },
});
