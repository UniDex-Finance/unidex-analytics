import { createContext, useEffect, useMemo, useState } from "react";
import { getStats } from "../queries/stats";
import type { StatsRaw } from "../queries/stats";
import { getCollateralSymbol } from "@/utils/data";
import { ChartWrapper } from "./charts/Wrapper";
import { OpenInterest } from "./charts/OpenInterest";
import { DayProductChart } from "./charts/DayProductChart";
import { Liquidations } from "./charts/Liquidations";

export const DataContext = createContext<{
  data: StatsRaw["data"] | null;
  isLoading: boolean;
  allChains: string[];
  allCollaterals: string[];
  allPairs: string[];
}>({
  data: null,
  isLoading: true,
  allChains: [],
  allCollaterals: [],
  allPairs: [],
});

function VolumeChart() {
  return (
    <ChartWrapper title="Volume">
      <DayProductChart valueKey="cumulativeVolumeUsd" />
    </ChartWrapper>
  );
}

function FeesChart() {
  return (
    <ChartWrapper title="Fees">
      <DayProductChart valueKey="cumulativeFeesUsd" />
    </ChartWrapper>
  );
}

function MarginChart() {
  return (
    <ChartWrapper title="Margin">
      <DayProductChart valueKey="cumulativeMarginUsd" />
    </ChartWrapper>
  );
}

function PnlChart() {
  return (
    <ChartWrapper title="Traders' PnL" defaultChains={["42161"]}>
      <DayProductChart valueKey="cumulativePnlUsd" />
    </ChartWrapper>
  );
}

function TradesChart() {
  return (
    <ChartWrapper title="Trades">
      <DayProductChart
        valueKey="tradeCount"
        formatter={new Intl.NumberFormat("en-US", { notation: "compact" })}
      />
    </ChartWrapper>
  );
}

function LiquidationsChart() {
  return (
    <ChartWrapper
      title="Liquidations"
      hiddenFilters={{ pair: true }}
      defaultGroupBy="collateral"
    >
      <Liquidations />
    </ChartWrapper>
  );
}

function OpenInterestChart() {
  return (
    <ChartWrapper title="Open Interest" fullWidth>
      <OpenInterest />
    </ChartWrapper>
  );
}

export const ChartsContainer = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<StatsRaw["data"] | null>(null);

  const { allChains, allCollaterals, allPairs } = useMemo(() => {
    if (!data)
      return {
        allChains: [],
        allCollaterals: [],
        allPairs: [],
      };

    let allPairs = new Set<string>();
    let allCollaterals = new Set<string>();
    let allChains = new Set<string>();

    for (const product of data.Products) {
      const [pair, collateral, chainId] = product._id.split(":");

      allPairs.add(pair);
      allCollaterals.add(
        getCollateralSymbol({
          address: collateral,
          chainId: Number(chainId),
          tokenInfos: data.TokenInfos,
        }) ?? "Unknown"
      );
      allChains.add(chainId);
    }

    return {
      allPairs: [...allPairs],
      allCollaterals: [...allCollaterals],
      allChains: [...allChains],
    };
  }, [data]);

  useEffect(() => {
    getStats()
      .then((data) => {
        setData(data);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <DataContext.Provider
        value={{ allChains, allCollaterals, allPairs, data, isLoading }}
      >
        <VolumeChart />
        <FeesChart />
        <MarginChart />
        <PnlChart />
        <TradesChart />
        <LiquidationsChart />
        <OpenInterestChart />
      </DataContext.Provider>
    </div>
  );
};
