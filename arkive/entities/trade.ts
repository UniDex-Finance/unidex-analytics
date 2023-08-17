import { createEntity } from "../deps.ts";

export interface Trade {
  _id: string;
  chainId: number;
  txHash: string;

  positionKey: string;

  user: string;
  currency: string;

  productId: string;
  margin: number;
  leverage: number;

  size: number;

  entryPrice: number;
  closePrice: number;

  isLong: boolean;

  fee: number;
  pnl: number;

  wasLiquidated: boolean;
  isFullClose: boolean;

  duration: number;

  timestamp: number;
  blockNumber: number;
}

export const Trade = createEntity<Trade>("Trade", {
  _id: "string",
  chainId: "number",
  txHash: "string",

  positionKey: "string",

  user: "string",
  currency: "string",

  productId: "string",
  margin: {
    type: "number",
    index: true,
  },
  leverage: {
    type: "number",
    index: true,
  },

  size: {
    type: "number",
    index: true,
  },

  entryPrice: {
    type: "number",
    index: true,
  },
  closePrice: {
    type: "number",
    index: true,
  },

  isLong: "boolean",

  fee: {
    type: "number",
    index: true,
  },
  pnl: {
    type: "number",
    index: true,
  },

  wasLiquidated: "boolean",
  isFullClose: "boolean",

  duration: {
    type: "number",
    index: true,
  },

  timestamp: {
    type: "number",
    index: true,
  },
  blockNumber: {
    type: "number",
    index: true,
  },
});
