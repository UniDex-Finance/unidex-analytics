import { createEntity } from "../deps.ts";

export interface Data {
  _id: string;
  chainId: number;
  cumulativeFees: number;
  cumulativePnl: number;
  cumulativeVolume: number;
  cumulativeMargin: number;

  openInterest: number;
  openInterestLong: number;
  openInterestShort: number;

  positionCount: number;
  tradeCount: number;
}

export const Data = createEntity<Data>("Data", {
  _id: "string",
  chainId: "number",

  cumulativeFees: "number",
  cumulativePnl: "number",
  cumulativeVolume: "number",
  cumulativeMargin: "number",

  openInterest: "number",
  openInterestLong: "number",
  openInterestShort: "number",

  positionCount: "number",
  tradeCount: "number",
});
