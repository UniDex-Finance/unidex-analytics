import { createEntity } from "../deps.ts";

export interface DayData {
  _id: string;
  chainId: number;

  date: number;
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

export const DayData = createEntity<DayData>("DayData", {
  _id: "string",
  chainId: "number",

  date: "number",
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
