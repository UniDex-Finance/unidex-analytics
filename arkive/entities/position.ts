import { createEntity } from "../deps.ts";

export interface Position {
  _id: string;
  chainId: number;
  productId: string;
  leverage: number;
  price: number;
  margin: number;
  fee: number;

  size: number;
  liquidationPrice: number;

  user: string;
  currency: string;

  isLong: boolean;

  createdAtTimestamp: number;
  createdAtBlockNumber: number;

  updatedAtTimestamp: number;
  updatedAtBlockNumber: number;
}

export const Position = createEntity<Position>("Position", {
  _id: "string",
  chainId: "number",
  productId: "string",
  leverage: "number",
  price: "number",
  margin: "number",
  fee: "number",

  size: "number",
  liquidationPrice: "number",

  user: "string",
  currency: "string",

  isLong: "boolean",

  createdAtTimestamp: "number",
  createdAtBlockNumber: "number",

  updatedAtTimestamp: "number",
  updatedAtBlockNumber: "number",
});
