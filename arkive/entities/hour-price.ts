import { createEntity } from "../deps.ts";

export interface HourPrice {
  _id: string; // currency:chainId:hourTimestamp
  hourTimestamp: number; // hourTimestamp of the hour in ms
  currency: string;
  chainId: number;
  priceUsd: number;
}

export const HourPrice = createEntity<HourPrice>("HourPrice", {
  _id: "string",
  hourTimestamp: "number",
  currency: "string",
  chainId: "number",
  priceUsd: "number",
});
