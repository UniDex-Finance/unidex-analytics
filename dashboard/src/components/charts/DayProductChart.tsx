import { getGroupKey, getTopGroups, isFiltered } from "@/utils/data";
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

        const topGroups = getTopGroups({
          chainFilter,
          collateralFilter,
          data,
          groupBy,
          pairFilter,
          valueKey,
          topGroupLimit,
        });

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

            const isTopGroup = topGroups.includes(groupKey);
            const mappedGroupKey = isTopGroup ? groupKey : "Others";

            if (!acc.data[timestamp]) {
              acc.data[timestamp] = {
                timestamp,
                [mappedGroupKey]: dayProduct[valueKey],
                Cumulative: dayProduct[valueKey] + acc.cumulative,
              };
              for (const key of topGroups) {
                if (key !== mappedGroupKey) {
                  acc.data[timestamp][key] = 0;
                }
              }
            } else {
              if (!acc.data[timestamp][mappedGroupKey]) {
                acc.data[timestamp][mappedGroupKey] = dayProduct[valueKey];
              } else {
                acc.data[timestamp][mappedGroupKey] += dayProduct[valueKey];
              }
              acc.data[timestamp].Cumulative += dayProduct[valueKey];
            }

            acc.cumulative += dayProduct[valueKey];

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

        // add previous cumulative to latest cumulative
        const values = Object.values(dataMap.data).map((item) => {
          item.Cumulative = item.Cumulative + totalValue - dataMap.cumulative;
          return item;
        });

        return { topGroups, data: values };
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
