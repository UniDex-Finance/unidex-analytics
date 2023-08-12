import { createEntity } from "../deps.ts";

export interface Data {
  _id: string;
  cumulativeFees: string;
  cumulativePnl: string;
  cumulativeVolume: string;
  cumulativeMargin: string;

  openInterest: string;
  openInterestLong: string;
  openInterestShort: string;

  positionCount: number;
  tradeCount: number;
}

export const Data = createEntity<Data>("Data", {
  cumulativeFees: String,
  cumulativePnl: String,
  cumulativeVolume: String,
  cumulativeMargin: String,

  openInterest: String,
  openInterestLong: String,
  openInterestShort: String,

  positionCount: Number,
  tradeCount: Number,
});
