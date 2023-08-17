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
  leverage: {
    type: "number",
    index: true,
  },
  price: {
    type: "number",
    index: true,
  },
  margin: {
    type: "number",
    index: true,
  },
  fee: {
    type: "number",
    index: true,
  },

  size: {
    type: "number",
    index: true,
  },
  liquidationPrice: {
    type: "number",
    index: true,
  },

  user: "string",
  currency: "string",

  isLong: "boolean",

  createdAtTimestamp: {
    type: "number",
    index: true,
  },
  createdAtBlockNumber: {
    type: "number",
    index: true,
  },

  updatedAtTimestamp: {
    type: "number",
    index: true,
  },
  updatedAtBlockNumber: {
    type: "number",
    index: true,
  },
});
