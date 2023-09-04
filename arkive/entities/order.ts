import { createEntity } from "../deps.ts";

export interface Order {
  _id: string; // key:chainId
  chainId: number;
  productId: string;
  margin: number;
  limitPrice: string;
  referral: string;
  size: number;

  user: string;
  currency: string;

  isLong: boolean;
  isClose: boolean;

  isOpen: boolean; // order has not settled yet

  createdAtTimestamp: number;
  createdAtBlockNumber: number;

  updatedAtTimestamp: number;
  updatedAtBlockNumber: number;
}

export const Order = createEntity<Order>("Order", {
  _id: "string",
  chainId: "number",
  productId: "string",
  margin: "number",
  limitPrice: "string",
  referral: "string",
  size: "number",

  user: "string",
  currency: "string",

  isLong: "boolean",
  isClose: "boolean",

  isOpen: "boolean",

  createdAtTimestamp: "number",
  createdAtBlockNumber: "number",

  updatedAtTimestamp: "number",
  updatedAtBlockNumber: "number",
});
