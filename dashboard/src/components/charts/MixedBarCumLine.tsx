import {
  ResponsiveContainer,
  Line,
  CartesianGrid,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  ReferenceLine,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { ChartWrapper } from "./Wrapper";
import { generateColor } from "../../utils/colors";
import { getChainName } from "../../utils/chains";
import type { StatsRaw } from "../../queries/stats";

export const MixedBarCumLineChart = (params: {
  data: StatsRaw["data"];
  valueKey: Exclude<
    keyof StatsRaw["data"]["DayProducts"][number],
    "_id" | "date"
  >;
}) => {
  const { data } = params;

  const [groupBy, setGroupBy] = useState<"pair" | "collateral" | "chain">(
    "pair"
  );
  const [showOthers, setShowOthers] = useState<boolean>(true);
  const [topGroupLimit, setTopGroupLimit] = useState<number | undefined>(8);

  useEffect(() => {
    switch (groupBy) {
      case "pair":
        setTopGroupLimit(8);
        setShowOthers(true);
        break;
      case "collateral":
        setTopGroupLimit(4);
        setShowOthers(true);
        break;
      case "chain":
        setTopGroupLimit(undefined);
        setShowOthers(false);
        break;
    }
  }, [groupBy]);

  const transformedData = useMemo(() => {
    const getGroupKey = (splitId: [string, string, string]) => {
      const [pair, collateral, chainId] = splitId;
      return groupBy === "pair"
        ? pair
        : groupBy === "collateral"
        ? data.TokenInfos.find(
            (token) =>
              token.currency === collateral && token.chainId === Number(chainId)
          )!.symbol
        : getChainName(chainId);
    };

    const topGroups = showOthers
      ? Object.entries(
          data.Products.reduce((acc, product) => {
            const splitId = product._id.split(":");

            const groupKey = getGroupKey(splitId as [string, string, string]);

            if (!acc[groupKey]) {
              acc[groupKey] = product[params.valueKey];
            } else {
              acc[groupKey] += product[params.valueKey];
            }
            return acc;
          }, {} as Record<string, number>)
        )
          .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
          .slice(0, topGroupLimit)
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

    if (showOthers) topGroups.push("Others");

    const totalVolume = data.Products.reduce(
      (acc, product) => acc + product[params.valueKey],
      0
    );

    let latestTimestamp = 0;

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
            [mappedGroupKey]: item[params.valueKey],
            Total: item[params.valueKey] + acc.total,
          };
          for (const key of topGroups) {
            if (key !== mappedGroupKey) {
              acc.data[timestamp][key] = 0;
            }
          }
        } else {
          if (!acc.data[timestamp][mappedGroupKey]) {
            acc.data[timestamp][mappedGroupKey] = item[params.valueKey];
          } else {
            acc.data[timestamp][mappedGroupKey] += item[params.valueKey];
          }
          acc.data[timestamp].Total += item[params.valueKey];
        }

        acc.total += item[params.valueKey];

        if (timestamp > latestTimestamp) {
          latestTimestamp = timestamp;
        }

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

    const latestTotal = res.data[latestTimestamp]?.Total ?? 0;

    // add previous total to latest total
    const values = Object.values(res.data).map((item) => {
      item.Total = item.Total - latestTotal + totalVolume;
      return item;
    });

    return { topGroups, data: values, allGroupKeys: [...res.allGroupKeys] };
  }, [data, groupBy, showOthers, topGroupLimit]);

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    currency: "USD",
    notation: "compact",
    style: "currency",
  });

  const getSubject = () => {
    switch (params.valueKey) {
      case "cumulativeVolumeUsd":
        return "Volume";
      case "cumulativeFeesUsd":
        return "Fees";
      case "openInterestLongUsd":
        return "Long Open Interest";
      case "openInterestShortUsd":
        return "Short Open Interest";
      case "cumulativeMarginUsd":
        return "Margin";
      case "cumulativePnlUsd":
        return "Traders' PnL";
      default:
        return params.valueKey;
    }
  };

  return (
    <ChartWrapper>
      <h2 className="w-full text-center text-xl flex items-center justify-center gap-2">
        {`${getSubject()} by `}
        <select
          className="select select-ghost w-full max-w-[8rem]"
          value={groupBy}
          onChange={(e) =>
            setGroupBy(e.target.value as "pair" | "collateral" | "chain")
          }
        >
          <option value="pair">Pair</option>
          <option value="collateral">Collateral</option>
          <option value="chain">Chain</option>
        </select>
      </h2>
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
            label={{ value: "Total", angle: -90, position: "insideRight" }}
          />
          <Tooltip
            formatter={(value) => currencyFormatter.format(Number(value))}
            labelFormatter={(value) =>
              new Date(value * 1000).toLocaleDateString("en-US", {
                dateStyle: "short",
              })
            }
            itemSorter={(item) => -(item.value as number)}
            itemStyle={{ fontSize: "0.8rem" }}
            contentStyle={{
              backgroundColor: "rgba(20,20,20,0.9)",
              color: "white",
            }}
          />
          {transformedData.topGroups.map((group, i) => (
            <Bar
              dataKey={group}
              key={group}
              stackId={"a"}
              fill={generateColor(i)}
              yAxisId="left"
            />
          ))}
          <Line
            type="monotone"
            dataKey="Total"
            stroke="#8884d8"
            yAxisId="right"
          />
          <ReferenceLine y={0} yAxisId={"left"} stroke="#666" />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};
