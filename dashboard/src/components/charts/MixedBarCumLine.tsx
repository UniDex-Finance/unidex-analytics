import {
  ResponsiveContainer,
  Line,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  ReferenceLine,
} from "recharts";
import { useContext, useEffect, useMemo } from "react";
import { FilterContext } from "./Wrapper";
import { generateColor } from "../../utils/colors";
import type { StatsRaw } from "../../queries/stats";
import { getGroupKey, getTopGroups, isFiltered } from "@/utils/data";
import { DataContext } from "../ChartsContainer";
import { currencyFormatter } from "@/utils/formatter";
import { CustomTooltip } from "./CustomTooltip";

export interface MixedBarCumLineChartProps {
  valueKey: Exclude<
    keyof StatsRaw["data"]["DayProducts"][number],
    "_id" | "date"
  >;
}

export function MixedBarCumLineChart({ valueKey }: MixedBarCumLineChartProps) {
  const { data } = useContext(DataContext);
  const { groupBy, chainFilter, collateralFilter, pairFilter } =
    useContext(FilterContext);

  const transformedData = useMemo(() => {
    if (!data)
      return {
        topGroups: [],
        data: [],
      };

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
        const [pair, collateral, chainId, dayId] = dayProduct._id.split(":");

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
  }, [data, groupBy, collateralFilter, pairFilter, chainFilter]);

  return (
    <ResponsiveContainer width="100%" height="85%">
      <ComposedChart
        data={transformedData.data}
        margin={{ left: 20, right: 10 }}
        syncId={"date"}
        width={600}
        height={400}
        stackOffset="sign"
      >
        <XAxis
          dataKey="timestamp"
          scale="time"
          type="number"
          domain={([dataMin, dataMax]) => [dataMin - 43200, dataMax + 43200]}
          tickFormatter={(value) =>
            new Date(value * 1000).toLocaleDateString("en-US", {
              dateStyle: "short",
            })
          }
          tickMargin={10}
        />
        <YAxis
          tickFormatter={(value) => currencyFormatter.format(value)}
          tickMargin={10}
          yAxisId="left"
        />
        <YAxis
          tickFormatter={(value) => currencyFormatter.format(value)}
          yAxisId="right"
          orientation="right"
          domain={([dataMin, dataMax]) => {
            const range = dataMax - dataMin;
            return [dataMin, dataMax + range * 0.05];
          }}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            const total = payload
              ?.filter((item) => item.name !== "Cumulative")
              .reduce((acc, item) => acc + Number(item.value), 0);
            return (
              <CustomTooltip
                total={total}
                active={active}
                payload={payload}
                label={label}
              />
            );
          }}
        />
        {transformedData.topGroups.map((group, i) => (
          <Bar
            dataKey={group}
            key={group}
            stackId={"a"}
            fill={generateColor(i)}
            yAxisId="left"
            isAnimationActive={false}
          />
        ))}
        <Line
          type="monotone"
          dataKey="Cumulative"
          stroke="#8884d8"
          yAxisId="right"
          isAnimationActive={false}
        />
        <ReferenceLine y={0} yAxisId={"left"} stroke="#666" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
