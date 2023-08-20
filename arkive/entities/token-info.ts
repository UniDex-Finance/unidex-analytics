import { createEntity } from "../deps.ts";

export interface TokenInfo {
  _id: string; // currency:chainId
  currency: string;
  mappedCurrency: string;
  name: string;
  symbol: string;
  chainId: number;
  poolChainId: number;
  coingeckoChainId: string;
  decimals: number;
  poolAddress: string;
  poolIsInBase: boolean;
  createdAtTimestamp: number;
}

export const TokenInfo = createEntity<TokenInfo>(
  "TokenInfo",
  {
    _id: "string",
    currency: "string",
    mappedCurrency: "string",
    name: "string",
    symbol: "string",
    decimals: "number",
    chainId: "number",
    poolChainId: "number",
    coingeckoChainId: "string",
    poolAddress: "string",
    poolIsInBase: "boolean",
    createdAtTimestamp: { type: "number", index: true },
  },
);
