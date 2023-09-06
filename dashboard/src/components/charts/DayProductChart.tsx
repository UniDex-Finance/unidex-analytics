import { getGroupKey, isFiltered } from "@/utils/data";
import { MixedBarCumLineChart } from "./MixedBarCumLine";
import type { StatsRaw } from "@/queries/stats";
import { Bar } from "recharts";
import { generateColor } from "@/utils/colors";

export interface DayProductChartProps {
  valueKey: Exclude<
    keyof StatsRaw["data"]["DayProducts"][number],
    "_id" | "date"
  >;
  formatter?: Intl.NumberFormat;
}

export function DayProductChart({ valueKey, formatter }: DayProductChartProps) {
  return (
    <MixedBarCumLineChart
      transformer={({
        chainFilter,
        collateralFilter,
        data,
        groupBy,
        pairFilter,
      }) => {
        const totalValue = data.Products.reduce(
          (acc, product) => acc + product[valueKey],
          0
        );

        const topGroupLimit =
          groupBy === "pair" ? 8 : groupBy === "collateral" ? 4 : undefined;

        const dataMap = data.DayProducts.reduce(
          (acc, dayProduct) => {
            const [pair, collateral, chainId, dayId] =
              dayProduct._id.split(":");

            if (
              isFiltered({
                splitId: [pair, collateral, chainId],
                data,
                chainFilter,
                collateralFilter,
                pairFilter,
              })
            ) {
              return acc;
            }

            const groupKey = getGroupKey({
              splitId: [pair, collateral, chainId],
              data,
              groupBy,
            });

            const timestamp = Number(dayId) * 86400;

            if (!acc.data[timestamp]) {
              acc.data[timestamp] = {
                timestamp,
                [groupKey]: dayProduct[valueKey],
                Cumulative: dayProduct[valueKey] + acc.cumulative,
              };
            } else {
              if (!acc.data[timestamp][groupKey]) {
                acc.data[timestamp][groupKey] = dayProduct[valueKey];
              } else {
                acc.data[timestamp][groupKey] += dayProduct[valueKey];
              }
              acc.data[timestamp].Cumulative += dayProduct[valueKey];
            }

            acc.cumulative += dayProduct[valueKey];

            acc.allKeys.add(groupKey);

            return acc;
          },
          {
            data: {} as Record<
              number,
              Record<string, number> & { timestamp: number }
            >, // timestamp -> { [groupVolume]: number, timestamp: number }
            cumulative: 0,
            allKeys: new Set<string>(),
          }
        );

        // add previous cumulative to latest cumulative
        const values = Object.values(dataMap.data).map((item) => {
          const sorted = Object.entries(item)
            .filter(([key]) => key !== "timestamp" && key !== "Cumulative")
            .sort((a, b) => {
              return b[1] - a[1];
            });
          const topGroups = sorted.slice(0, topGroupLimit);

          const newItem = {
            ...Object.fromEntries(topGroups),
            Cumulative: item.Cumulative + totalValue - dataMap.cumulative,
            timestamp: item.timestamp,
          };

          if (topGroupLimit) {
            const others = sorted
              .slice(topGroupLimit)
              .reduce((acc, [_, value]) => acc + value, 0);

            others > 0 && (newItem["Others"] = others);
          }

          return newItem;
        });

        return {
          data: values,
          topGroups: Array.from(dataMap.allKeys).concat("Others"),
        };
      }}
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
      formatter={formatter}
    />
  );
}
