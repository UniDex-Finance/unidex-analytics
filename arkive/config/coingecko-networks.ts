export const chainIdToCoingeckoId = {
  1: "eth",
  10: "optimism",
  250: "ftm",
  324: "zksync",
  8453: "base",
  42161: "arbitrum",
} as const;

export const chainNativeWrappedTokens = {
  1: { address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", chainId: 1 },
  10: { address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", chainId: 1 },
  250: { address: "0x4e15361fd6b4bb609fa63c81a2be19d873717870", chainId: 1 },
  324: { address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", chainId: 1 },
  8453: { address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", chainId: 1 },
  42161: { address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", chainId: 1 },
} as const;
