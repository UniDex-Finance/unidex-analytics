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
import { DataContext } from "../ChartsContainer";
import { currencyFormatter } from "@/utils/formatter";
import { CustomTooltip } from "./CustomTooltip";

export interface MixedBarCumLineChartProps {
  transformer: (params: {
    data: StatsRaw["data"];
    groupBy: "pair" | "collateral" | "chain";
    pairFilter: string[];
    collateralFilter: string[];
    chainFilter: string[];
  }) => { topGroups: string[]; data: Record<string, number>[] };
  barsMapper: (group: string, index: number) => React.ReactNode;
  lineKey: string;
  formatter?: Intl.NumberFormat;
  hideLine?: boolean;
}

export function MixedBarCumLineChart({
  transformer,
  barsMapper,
  lineKey,
  formatter,
  hideLine,
}: MixedBarCumLineChartProps) {
  const { data } = useContext(DataContext);
  const { groupBy, chainFilter, collateralFilter, pairFilter } =
    useContext(FilterContext);

  const transformedData = useMemo(() => {
    if (!data)
      return {
        topGroups: [],
        data: [],
      };
    return transformer({
      data,
      groupBy,
      chainFilter,
      collateralFilter,
      pairFilter,
    });
  }, [data, groupBy, collateralFilter, pairFilter, chainFilter]);

  return (
    <ResponsiveContainer width="100%" height={425}>
      <ComposedChart
        data={transformedData.data}
        margin={{ left: 20, right: 10 }}
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
          tickFormatter={(value) =>
            formatter
              ? formatter.format(value)
              : currencyFormatter.format(value)
          }
          tickMargin={10}
          yAxisId="left"
        />
        {!hideLine && (
          <YAxis
            tickFormatter={(value) =>
              formatter
                ? formatter.format(value)
                : currencyFormatter.format(value)
            }
            yAxisId="right"
            orientation="right"
            domain={([dataMin, dataMax]) => {
              const range = dataMax - dataMin;
              return [dataMin, dataMax + range * 0.05];
            }}
          />
        )}
        <Tooltip
          content={({ active, payload, label }) => {
            const total = payload
              ?.filter((item) => item.name !== lineKey)
              .reduce((acc, item) => acc + Number(item.value), 0);
            return (
              <CustomTooltip
                total={total}
                active={active}
                payload={payload}
                label={label}
                numberFormatter={formatter}
              />
            );
          }}
          filterNull={true}
        />
        {transformedData.topGroups.map(barsMapper)}
        {!hideLine && (
          <Line
            type="monotone"
            dataKey={lineKey}
            stroke="#8884d8"
            yAxisId="right"
            isAnimationActive={false}
            dot={false}
          />
        )}
        <ReferenceLine y={0} yAxisId={"left"} stroke="#666" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
