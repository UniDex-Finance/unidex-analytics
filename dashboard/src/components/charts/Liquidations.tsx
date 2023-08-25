import { getGroupKey, getTopGroups, isFiltered } from "@/utils/data";
import {
  MixedBarCumLineChart,
  type MixedBarCumLineChartProps,
} from "./MixedBarCumLine";
import { Bar } from "recharts";
import { generateColor } from "@/utils/colors";

export function Liquidations() {
  const transformer: MixedBarCumLineChartProps["transformer"] = ({
    chainFilter,
    collateralFilter,
    data,
    groupBy,
    pairFilter,
  }) => {
    const topGroupLimit =
      groupBy === "pair" ? 8 : groupBy === "collateral" ? 4 : undefined;

    const topGroups = getTopGroups({
      chainFilter,
      collateralFilter,
      data,
      groupBy,
      pairFilter,
      valueKey: "cumulativeVolumeUsd",
      topGroupLimit,
    });

    const dataMap = data.Trades.reduce(
      (acc, trade) => {
        const [_, currency, chain] = trade._id.split(":");

        if (!trade.wasLiquidated) {
          return acc;
        }

        if (
          isFiltered({
            splitId: ["", currency, chain],
            data,
            chainFilter,
            collateralFilter,
            pairFilter,
          })
        ) {
          return acc;
        }

        const groupKey = getGroupKey({
          splitId: ["", currency, chain],
          data,
          groupBy,
        });

        const timestamp = trade.timestamp - (trade.timestamp % 86400);

        const mappedGroupKey = topGroups.includes(groupKey)
          ? groupKey
          : "Others";

        if (!acc.data[timestamp]) {
          acc.data[timestamp] = {
            timestamp,
            [mappedGroupKey]: trade.sizeUsd,
            Cumulative: trade.sizeUsd + acc.cumulative,
          };
          for (const key of topGroups) {
            if (key !== mappedGroupKey) {
              acc.data[timestamp][key] = 0;
            }
          }
        } else {
          if (!acc.data[timestamp][mappedGroupKey]) {
            acc.data[timestamp][mappedGroupKey] = trade.sizeUsd;
          } else {
            acc.data[timestamp][mappedGroupKey] += trade.sizeUsd;
          }
          acc.data[timestamp].Cumulative += trade.sizeUsd;
        }

        acc.cumulative += trade.sizeUsd;

        return acc;
      },
      {
        data: {} as Record<
          number,
          Record<string, number> & { timestamp: number }
        >, // timestamp -> { [groupVolume]: number, timestamp: number }
        cumulative: 0,
      }
    );

    return {
      topGroups,
      data: Object.values(dataMap.data),
    };
  };

  return (
    <MixedBarCumLineChart
      barsMapper={(group, i) => (
        <Bar
          dataKey={group}
          key={group}
          stackId={"a"}
          fill={generateColor(i)}
          yAxisId="left"
          isAnimationActive={false}
        />
      )}
      lineKey="Cumulative"
      transformer={transformer}
    />
  );
}
