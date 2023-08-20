import { createEntity } from "../deps.ts";

export interface BaseDataStats {
  cumulativeFees: number;
  cumulativePnl: number;
  cumulativeVolume: number;
  cumulativeMargin: number;

  openInterest: number;
  openInterestLong: number;
  openInterestShort: number;
}

export type BaseDataStatsUsd =
  | {
    [Key in keyof BaseDataStats as `${Key}Usd`]: BaseDataStats[Key];
  }
    & BaseDataStats
  | never;

export interface BaseData extends BaseDataStatsUsd {
  chainId: number;

  positionCount: number;
  tradeCount: number;
}

export interface Data extends BaseData {
  _id: string; // currency:chainId
  createdAtTimestamp: number;
}

export const Data = createEntity<Data>("Data", {
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

  createdAtTimestamp: "number",
});
