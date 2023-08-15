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

  cumulativeFees: "number",
  cumulativePnl: "number",
  cumulativeVolume: "number",
  cumulativeMargin: "number",

  positionCount: "number",
  tradeCount: "number",

  openInterest: "number",
  openInterestLong: "number",
  openInterestShort: "number",
});
