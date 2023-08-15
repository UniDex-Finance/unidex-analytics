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
  margin: "number",
  leverage: "number",

  size: "number",

  entryPrice: "number",
  closePrice: "number",

  isLong: "boolean",

  fee: "number",
  pnl: "number",

  wasLiquidated: "boolean",
  isFullClose: "boolean",

  duration: "number",

  timestamp: "number",
  blockNumber: "number",
});
