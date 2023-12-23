import { createContext, useEffect, useMemo, useState } from "react";
import { getStats } from "../queries/stats";
import type { StatsRaw } from "../queries/stats";
import { getCollateralSymbol } from "@/utils/data";
import { ChartWrapper } from "./charts/Wrapper";
import { OpenInterest } from "./charts/OpenInterest";
import { DayProductChart } from "./charts/DayProductChart";
import { StatCard } from "./StatCard";
import { DatePickerWithRange } from "./ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { addDays, subDays } from "date-fns";
import { cn } from "@/utils/cn";
import { APRStatCard } from './APRCard';

export const DataContext = createContext<{
  data: StatsRaw["data"] | null;
  isLoading: boolean;
  allChains: string[];
  allCollaterals: string[];
  allPairs: string[];
  date: DateRange | undefined;
  isCurrent: boolean;
}>({
  data: null,
  isLoading: true,
  allChains: [],
  allCollaterals: [],
  allPairs: [],
  date: undefined,
  isCurrent: true,
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
    <ChartWrapper title="Fees" defaultGroupBy="chain">
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
<ChartWrapper title="Traders' PnL" defaultGroupBy="chain">
      <DayProductChart valueKey="cumulativePnlUsd" />
    </ChartWrapper>
  );
}

function TradesChart() {
  return (
    <ChartWrapper title="Trades" defaultGroupBy="chain">
      <DayProductChart
        valueKey="tradeCount"
        formatter={new Intl.NumberFormat("en-US", { notation: "compact" })}
      />
    </ChartWrapper>
  );
}

function LiquidationsChart() {
  return (
    <ChartWrapper title="Liquidations">
      <DayProductChart valueKey="cumulativeLiquidationsUsd" />
    </ChartWrapper>
  );
}

function OpenInterestChart() {
  return (
    <ChartWrapper title="Open Interest">
      <OpenInterest />
    </ChartWrapper>
  );
}

export const ChartsContainer = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<StatsRaw["data"] | null>(null);
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isCurrent, setIsCurrent] = useState(true);

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

  const [aprValue, setAprValue] = useState("");

  useEffect(() => {
    // Function to fetch APR from the API
    const fetchAPR = async () => {
      try {
        const response = await fetch("https://pool.unidexapi.com/pools");
        const apiData = await response.json();
        const apr = apiData.unidexTokenStats?.APR || "N/A";
        setAprValue(apr); // Directly setting the APR value
      } catch (error) {
        console.error("Error fetching APR:", error);
        setAprValue("Error");
      }
    };

    fetchAPR();
  }, []);

  useEffect(() => {
    if (!date) return;
    if (!date.from || !date.to) return;
    setIsLoading(true);
    getStats({ from: date.from, to: date.to })
      .then((data) => {
        setData(data);
      })
      .finally(() => {
        setIsLoading(false);
      });

    if (Date.now() - date.to.getTime() > 86400) {
      setIsCurrent(false);
    }
  }, [date]);

  return (
    <DataContext.Provider
      value={{
        allChains,
        allCollaterals,
        allPairs,
        data,
        isLoading,
        date,
        isCurrent,
      }}
    >
      <div className="flex flex-col gap-4">
        <DatePickerWithRange
          date={date}
          setDate={setDate}
          className={cn(
            "self-end outline outline-1 outline-slate-700 bg-opacity-10 bg-slate-500 rounded",
            {
              ["animate-pulse"]: isLoading,
              ["bg-opacity-20"]: isLoading,
            }
          )}
        />
        <div className="flex flex-col lg:flex-row gap-4 items-stretch justify-stretch">
        <APRStatCard title={"UNIDX 30D APR"} apr={aprValue} />

          <StatCard
            title={isCurrent ? "All-Time Volume" : "Total Volume"}
            valueKey="cumulativeVolumeUsd"
          />
          <StatCard title={"Unique Users"} valueKey="usersCount" />
          <StatCard
            title={isCurrent ? "All-Time Fees" : "Total Fees"}
            valueKey="cumulativeFeesUsd"
          />
          <StatCard
            title={isCurrent ? "All-Time Liquidations" : "Total Liquidations"}
            valueKey="cumulativeLiquidationsUsd"
          />
          <StatCard
            title={isCurrent ? "All-Time Traders' PnL" : "Total Traders' PnL"}
            valueKey="cumulativePnlUsd"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <VolumeChart />
          <FeesChart />
          <MarginChart />
          <PnlChart />
          <TradesChart />
          <LiquidationsChart />
          <OpenInterestChart />
        </div>
      </div>
    </DataContext.Provider>
  );
};
