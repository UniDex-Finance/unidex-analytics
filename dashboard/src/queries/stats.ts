/**
 * High-Level overview:
 * 1. Build graphQL query
 * 2. Call endpoint with query
 * 3. Return data
 */

export const GRAPHQL_ENDPOINT =
  "https://data.staging.arkiver.net/robolabs/unidex/graphql" as const;

export const buildQuery = (params: { from: number; to: number }) => {
  return {
    query: /* GraphQL */ `query ($gt: Float, $lte: Float) {
			DayProducts(filter: {_operators: {date: {gt: $gt, lte: $lte}}}, limit: 0) {
				_id
				cumulativeVolumeUsd
				cumulativeFeesUsd
				cumulativeLiquidationsUsd
				openInterestLongUsd
				openInterestShortUsd
				openInterestUsd
				cumulativeMarginUsd
				cumulativePnlUsd
				tradeCount
				positionCount
			}
			Products(limit: 0) {
				_id
				cumulativeVolumeUsd
				cumulativeFeesUsd
				cumulativeLiquidationsUsd
				openInterestLongUsd
				openInterestShortUsd
				openInterestUsd
				cumulativeMarginUsd
				cumulativePnlUsd
				tradeCount
				positionCount
			}
			TokenInfos {
				symbol
				currency
				chainId
			}
			UsersCount
		}`,
    variables: { "gt": params.from, "lte": params.to },
  };
};

export const getStats = async () => {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 30 * 24 * 60 * 60;

  const query = buildQuery({ from, to });

  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(query),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch stats: ${res.statusText}`);
  }

  const { data } = (await res.json()) as StatsRaw;

  return data;
};

export type StatsRaw = {
  data: {
    DayProducts: {
      _id: string;
      cumulativeVolumeUsd: number;
      cumulativeFeesUsd: number;
      cumulativeLiquidationsUsd: number;
      openInterestLongUsd: number;
      openInterestShortUsd: number;
      openInterestUsd: number;
      cumulativeMarginUsd: number;
      cumulativePnlUsd: number;
      tradeCount: number;
      positionCount: number;
    }[];
    Products: {
      _id: string;
      cumulativeVolumeUsd: number;
      cumulativeFeesUsd: number;
      cumulativeLiquidationsUsd: number;
      openInterestLongUsd: number;
      openInterestShortUsd: number;
      cumulativeMarginUsd: number;
      cumulativePnlUsd: number;
      tradeCount: number;
      positionCount: number;
      openInterestUsd: number;
    }[];
    TokenInfos: {
      symbol: string;
      currency: string;
      chainId: number;
    }[];
    UsersCount: number;
  };
};
