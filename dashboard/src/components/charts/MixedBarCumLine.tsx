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
import { useMemo, useState } from "react";
import { ChartWrapper } from "./Wrapper";
import { generateColor } from "../../utils/colors";
import { getChainName } from "../../utils/chains";
import type { StatsRaw } from "../../queries/stats";
import { GroupSelector } from "../GroupSelector";
import { Filter } from "../Filter";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Cross2Icon } from "@radix-ui/react-icons";
import { DropdownMenu, DropdownMenuItem } from "../ui/dropdown-menu";
import {
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  notation: "compact",
  style: "currency",
});

export interface MixedBarCumLineChartProps {
  data: StatsRaw["data"] | null;
  valueKey: Exclude<
    keyof StatsRaw["data"]["DayProducts"][number],
    "_id" | "date"
  >;
  isLoading: boolean;
  defaultPairs?: string[];
  defaultCollaterals?: string[];
  defaultChains?: string[];
}

export function MixedBarCumLineChart({
  data,
  isLoading,
  valueKey,
  defaultPairs = [],
  defaultChains = [],
  defaultCollaterals = [],
}: MixedBarCumLineChartProps) {
  const [groupBy, setGroupBy] = useState<"pair" | "collateral" | "chain">(
    "pair"
  );
  const [pairFilter, setPairFilter] = useState<string[]>(defaultPairs);
  const [collateralFilter, setCollateralFilter] =
    useState<string[]>(defaultCollaterals);
  const [chainFilter, setChainFilter] = useState<string[]>(defaultChains);

  const getCollateralSymbol = (params: {
    address: string;
    tokenInfos: StatsRaw["data"]["TokenInfos"];
    chainId: number;
  }) => {
    const { address, tokenInfos, chainId } = params;
    return tokenInfos.find(
      (token) => token.currency === address && token.chainId === chainId
    )?.symbol;
  };

  const isFiltered = (splitId: [string, string, string]) => {
    const [pair, collateral, chainId] = splitId;
    const collateralSymbol =
      getCollateralSymbol({
        address: collateral,
        chainId: Number(chainId),
        tokenInfos: data?.TokenInfos ?? [],
      }) ?? "Unknown";
    return (
      (pairFilter.length > 0 && !pairFilter.includes(pair)) ||
      (collateralFilter.length > 0 &&
        !collateralFilter.includes(collateralSymbol)) ||
      (chainFilter.length > 0 && !chainFilter.includes(chainId))
    );
  };

  const getGroupKey = (splitId: [string, string, string]) => {
    switch (groupBy) {
      case "pair":
        return splitId[0];
      case "collateral":
        return (
          getCollateralSymbol({
            address: splitId[1],
            tokenInfos: data?.TokenInfos ?? [],
            chainId: Number(splitId[2]),
          }) ?? "Unknown"
        );
      case "chain":
        return getChainName(splitId[2]);
    }
  };

  const getSubject = () => {
    switch (valueKey) {
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
        return valueKey;
    }
  };

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
  }, [data, valueKey]);

  const transformedData = useMemo(() => {
    if (!data)
      return {
        topGroups: [],
        data: [],
      };

    const showOthers = groupBy === "chain" ? false : true;
    const topGroupLimit =
      groupBy === "chain" ? undefined : groupBy === "pair" ? 8 : 4;

    let totalValue = 0;
    const topGroupsMap: Record<string, number> = {};

    for (const product of data.Products) {
      const splitId = product._id.split(":");

      if (isFiltered(splitId as [string, string, string])) {
        continue;
      }

      totalValue += product[valueKey];

      if (!showOthers) continue;

      const groupKey = getGroupKey(splitId as [string, string, string]);

      if (!topGroupsMap[groupKey]) {
        topGroupsMap[groupKey] = product[valueKey];
      } else {
        topGroupsMap[groupKey] += product[valueKey];
      }
    }

    const topGroups = showOthers
      ? Object.entries(topGroupsMap)
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

    let latestTimestamp = 0;

    const res = data.DayProducts.reduce(
      (acc, item) => {
        const [pair, collateral, chainId, dayId] = item._id.split(":");

        if (isFiltered([pair, collateral, chainId])) {
          return acc;
        }

        const groupKey = getGroupKey([pair, collateral, chainId]);

        const timestamp = Number(dayId) * 86400;

        const isTopGroup = topGroups.includes(groupKey);
        const mappedGroupKey = isTopGroup ? groupKey : "Others";

        if (!acc.data[timestamp]) {
          acc.data[timestamp] = {
            timestamp,
            [mappedGroupKey]: item[valueKey],
            Cumulative: item[valueKey] + acc.cumulative,
          };
          for (const key of topGroups) {
            if (key !== mappedGroupKey) {
              acc.data[timestamp][key] = 0;
            }
          }
        } else {
          if (!acc.data[timestamp][mappedGroupKey]) {
            acc.data[timestamp][mappedGroupKey] = item[valueKey];
          } else {
            acc.data[timestamp][mappedGroupKey] += item[valueKey];
          }
          acc.data[timestamp].Cumulative += item[valueKey];
        }

        acc.cumulative += item[valueKey];

        if (timestamp > latestTimestamp) {
          latestTimestamp = timestamp;
        }

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

    const latestTotal = res.data[latestTimestamp]?.Cumulative ?? 0;

    // add previous cumulative to latest cumulative
    const values = Object.values(res.data).map((item) => {
      item.Cumulative = item.Cumulative - latestTotal + totalValue;
      return item;
    });

    return { topGroups, data: values };
  }, [data, groupBy, collateralFilter, pairFilter, chainFilter]);

  return (
    <ChartWrapper isLoading={isLoading}>
      <div>
        <div className="flex items-center gap-2 px-4 pb-2 flex-wrap">
          <h2 className="text-xl flex-1">{getSubject()}</h2>
          <GroupSelector
            setter={(value) => setGroupBy(value as any)}
            value={groupBy}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={"outline"} className="h-8">
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Filter
                  options={allPairs.map((pair) => ({
                    label: pair,
                    value: pair,
                  }))}
                  setter={setPairFilter}
                  title="Pair"
                  selectedValues={pairFilter}
                />
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Filter
                  options={allCollaterals.map((collateral) => ({
                    label: collateral,
                    value: collateral,
                  }))}
                  setter={setCollateralFilter}
                  title="Collateral"
                  selectedValues={collateralFilter}
                />
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Filter
                  options={allChains.map((chain) => ({
                    label: getChainName(chain),
                    value: chain,
                  }))}
                  setter={setChainFilter}
                  title="Chain"
                  selectedValues={chainFilter}
                />
              </DropdownMenuItem>
              {(pairFilter.length > 0 ||
                collateralFilter.length > 0 ||
                chainFilter.length > 0) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setPairFilter([]);
                        setCollateralFilter([]);
                        setChainFilter([]);
                      }}
                      className="h-8 px-2 lg:px-3"
                    >
                      Reset
                      <Cross2Icon className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Separator />
      </div>
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
                <div className="flex flex-col gap-1">
                  <div className="text-center">
                    {new Date(Number(label) * 1000).toLocaleDateString(
                      "en-US",
                      {
                        dateStyle: "short",
                      }
                    )}
                  </div>
                  {active && payload && payload.length > 0 && (
                    <div className="flex flex-col gap-0 text-xs rounded bg-opacity-90 bg-slate-700 px-4 py-2">
                      {payload.reverse().map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="flex-1">{item.name}</div>
                          <div>
                            {currencyFormatter.format(Number(item.value))}
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: "#8884d8" }}
                        />
                        <div className="flex-1 font-bold">Total</div>
                        <div className="font-bold">
                          {currencyFormatter.format(total ?? 0)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
    </ChartWrapper>
  );
}
