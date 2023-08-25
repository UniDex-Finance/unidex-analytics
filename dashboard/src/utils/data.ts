import type { StatsRaw } from "@/queries/stats";
import { getChainName } from "./chains";

export const getCollateralSymbol = (params: {
  address: string;
  tokenInfos: StatsRaw["data"]["TokenInfos"];
  chainId: number;
}) => {
  const { address, tokenInfos, chainId } = params;
  return tokenInfos.find(
    (token) => token.currency === address && token.chainId === chainId,
  )?.symbol;
};

export const getSubject = (
  valueKey: keyof StatsRaw["data"]["DayProducts"][number],
) => {
  switch (valueKey) {
    case "cumulativeVolumeUsd":
      return "Volume";
    case "cumulativeFeesUsd":
      return "Fees";
    case "openInterestLongUsd":
      return "Long Open Interest";
    case "openInterestShortUsd":
      return "Short Open Interest";
    case "cumulativeMarginUsd":
      return "Margin";
    case "cumulativePnlUsd":
      return "Traders' PnL";
    default:
      return valueKey;
  }
};

export const isFiltered = (params: {
  data: StatsRaw["data"];
  splitId: [string, string, string];
  pairFilter: string[];
  collateralFilter: string[];
  chainFilter: string[];
}) => {
  const { chainFilter, collateralFilter, pairFilter, splitId, data } = params;
  const [pair, collateral, chainId] = splitId;
  const collateralSymbol = getCollateralSymbol({
    address: collateral,
    chainId: Number(chainId),
    tokenInfos: data.TokenInfos,
  }) ?? "Unknown";
  return (
    (pairFilter.length > 0 && !pairFilter.includes(pair)) ||
    (collateralFilter.length > 0 &&
      !collateralFilter.includes(collateralSymbol)) ||
    (chainFilter.length > 0 && !chainFilter.includes(chainId))
  );
};

export const getGroupKey = (params: {
  splitId: [string, string, string];
  data: StatsRaw["data"];
  groupBy: "pair" | "collateral" | "chain";
}) => {
  const { groupBy, splitId, data } = params;
  switch (groupBy) {
    case "pair":
      return splitId[0];
    case "collateral":
      return (
        getCollateralSymbol({
          address: splitId[1],
          tokenInfos: data.TokenInfos ?? [],
          chainId: Number(splitId[2]),
        }) ?? "Unknown"
      );
    case "chain":
      return getChainName(splitId[2]);
  }
};

export const getTopGroups = (params: {
  valueKey: Exclude<
    keyof StatsRaw["data"]["DayProducts"][number],
    "_id" | "date"
  >;
  data: StatsRaw["data"];
  groupBy: "pair" | "collateral" | "chain";
  pairFilter: string[];
  collateralFilter: string[];
  chainFilter: string[];
  topGroupLimit?: number;
}) => {
  if (!params.topGroupLimit) {
    return [
      ...new Set(
        params.data.Products.map((product) => {
          const splitId = product._id.split(":");

          const groupKey = getGroupKey({
            splitId: splitId as [string, string, string],
            data: params.data,
            groupBy: params.groupBy,
          });

          return groupKey;
        }),
      ),
    ];
  }

  return Object.entries(params.data.Products
    .reduce((acc, product) => {
      const splitId = product._id.split(":");

      if (
        isFiltered({
          splitId: splitId as [string, string, string],
          data: params.data,
          chainFilter: params.chainFilter,
          collateralFilter: params.collateralFilter,
          pairFilter: params.pairFilter,
        })
      ) {
        return acc;
      }

      const groupKey = getGroupKey({
        splitId: splitId as [string, string, string],
        data: params.data,
        groupBy: params.groupBy,
      });

      if (!acc[groupKey]) {
        acc[groupKey] = product[params.valueKey];
      } else {
        acc[groupKey] += product[params.valueKey];
      }

      return acc;
    }, {} as Record<string, number>))
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, params.topGroupLimit)
    .map(([key]) => key)
    .concat("Others");
};
