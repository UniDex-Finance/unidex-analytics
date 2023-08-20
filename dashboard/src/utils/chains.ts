export const CHAIN_NAMES = {
  "1": "Ethereum",
  "10": "Optimism",
  "250": "Fantom",
  "324": "ZkSync",
  "8453": "Base",
  "42161": "Arbitrum",
} as Record<string, string>;

export const getChainName = (chainId: string) => {
  return CHAIN_NAMES[chainId];
};
