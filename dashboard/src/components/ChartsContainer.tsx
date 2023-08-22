import { useEffect, useState } from "react";
import { getStats } from "../queries/stats";
import type { StatsRaw } from "../queries/stats";
import { MixedBarCumLineChart } from "./charts/MixedBarCumLine";

export const ChartsContainer = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<StatsRaw["data"] | null>(null);

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
      <MixedBarCumLineChart
        valueKey="cumulativeVolumeUsd"
        data={data}
        isLoading={isLoading}
      />
      <MixedBarCumLineChart
        valueKey="cumulativeFeesUsd"
        data={data}
        isLoading={isLoading}
      />
      <MixedBarCumLineChart
        valueKey="cumulativeMarginUsd"
        data={data}
        isLoading={isLoading}
      />
      <MixedBarCumLineChart
        valueKey="cumulativePnlUsd"
        data={data}
        isLoading={isLoading}
        defaultChains={["42161"]}
      />
    </div>
  );
};
