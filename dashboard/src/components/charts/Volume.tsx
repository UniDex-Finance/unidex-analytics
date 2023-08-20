import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  Line,
  CartesianGrid,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Bar,
} from "recharts";
import { useMemo } from "react";
import { getStats } from "../../queries/stats";
import { cn } from "../../utils/cn";
import { ChartWrapper } from "./Wrapper";
import { generateColor } from "../../utils/colors";
import { getChainName } from "../../utils/chains";

export const VolumeChart = (params: {
  groupBy: "pair" | "collateral" | "chain";
  topGroupLimit?: number;
  showOthers?: boolean;
}) => {
  const { isLoading, isError, data } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
  });

  const transformedData = useMemo(() => {
    if (!data) return { topGroups: [], data: [], allGroupKeys: [] };

    const getGroupKey = (splitId: [string, string, string]) => {
      const [pair, collateral, chainId] = splitId;
      return params.groupBy === "pair"
        ? pair
        : params.groupBy === "collateral"
        ? data.TokenInfos.find((token) => token.currency === collateral)!.symbol
        : getChainName(chainId);
    };

    const topGroups = params.showOthers
      ? Object.entries(
          data.Products.reduce((acc, product) => {
            const splitId = product._id.split(":");

            const groupKey = getGroupKey(splitId as [string, string, string]);

            if (!acc[groupKey]) {
              acc[groupKey] = product.cumulativeVolumeUsd;
            } else {
              acc[groupKey] += product.cumulativeVolumeUsd;
            }
            return acc;
          }, {} as Record<string, number>)
        )
          .sort((a, b) => b[1] - a[1])
          .slice(0, params.topGroupLimit ?? 8)
          .map(([groupKey]) => groupKey)
      : [
          ...new Set(
            data.Products.map((product) => {
              const splitId = product._id.split(":");

              const groupKey = getGroupKey(splitId as [string, string, string]);

              return groupKey;
            })
          ),
        ];

    if (params.showOthers) topGroups.unshift("Others");

    const res = data.DayProducts.reduce(
      (acc, item) => {
        const [pair, collateral, chainId, dayId] = item._id.split(":");

        const groupKey = getGroupKey([pair, collateral, chainId]);

        acc.allGroupKeys.add(groupKey);

        const timestamp = Number(dayId) * 86400;

        const isTopGroup = topGroups.includes(groupKey);
        const mappedGroupKey = isTopGroup ? groupKey : "Others";

        if (!acc.data[timestamp]) {
          acc.data[timestamp] = {
            timestamp,
            [mappedGroupKey]: item.cumulativeVolumeUsd,
            Total: item.cumulativeVolumeUsd + acc.total,
          };
        } else {
          if (!acc.data[timestamp][mappedGroupKey]) {
            acc.data[timestamp][mappedGroupKey] = item.cumulativeVolumeUsd;
          } else {
            acc.data[timestamp][mappedGroupKey] += item.cumulativeVolumeUsd;
          }
          acc.data[timestamp].Total += item.cumulativeVolumeUsd;
        }

        acc.total += item.cumulativeVolumeUsd;

        return acc;
      },
      {
        allGroupKeys: new Set<string>(),
        data: {} as Record<
          number,
          Record<string, number> & { timestamp: number }
        >, // timestamp -> { [groupVolume]: number, timestamp: number }
        total: 0,
      }
    );

    // add 0 values for groups that don't have data for a given day
    const values = Object.values(res.data).map((item) => {
      for (const key of topGroups) {
        if (!item[key]) {
          item[key] = 0;
        }
      }
      return item;
    });

    return { topGroups, data: values, allGroupKeys: [...res.allGroupKeys] };
  }, [data]);

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    currency: "USD",
    notation: "compact",
    style: "currency",
  });

  return (
    <ChartWrapper
      title={`Volume by ${params.groupBy
        .slice(0, 1)
        .toUpperCase()}${params.groupBy.slice(1)}`}
      isError={isError}
      isLoading={isLoading}
    >
      <ResponsiveContainer
        width="100%"
        height="85%"
        className={cn({ ["invisible"]: isError || isLoading })}
      >
        <ComposedChart data={transformedData.data} margin={{ left: 20 }}>
          <CartesianGrid stroke="#f5f5f5" />
          <XAxis
            dataKey="timestamp"
            scale="time"
            type="number"
            domain={([dataMin, dataMax]) => [dataMin - 43200, dataMax + 43200]}
            tickFormatter={(value) =>
              new Date(value * 1000).toLocaleDateString()
            }
            tickMargin={10}
          />
          <YAxis
            tickFormatter={(value) => currencyFormatter.format(value)}
            tickMargin={10}
          />
          <Tooltip
            formatter={(value) => currencyFormatter.format(Number(value))}
          />
          {/* <Legend /> */}
          <Line type="monotone" dataKey="Total" stroke="#8884d8" />
          {transformedData.topGroups.map((group, i) => (
            <Bar
              dataKey={group}
              key={group}
              stackId={"a"}
              fill={generateColor(i)}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};
