import { createEntity } from "../deps.ts";

export interface DayProduct {
  _id: string;
  chainId: number;

  date: number;
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

export const DayProduct = createEntity<DayProduct>("DayProduct", {
  _id: "string",
  chainId: "number",

  date: "number",
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
