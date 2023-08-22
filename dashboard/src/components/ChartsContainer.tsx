import { getStats } from "../queries/stats";
import { MixedBarCumLineChart } from "./charts/MixedBarCumLine";

const data = await getStats();

export const ChartsContainer = () => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <MixedBarCumLineChart valueKey="cumulativeVolumeUsd" data={data} />
      <MixedBarCumLineChart valueKey="cumulativeFeesUsd" data={data} />
      <MixedBarCumLineChart valueKey="cumulativeMarginUsd" data={data} />
      <MixedBarCumLineChart
        valueKey="cumulativePnlUsd"
        data={data}
        defaultChains={["42161"]}
      />
    </div>
  );
};
