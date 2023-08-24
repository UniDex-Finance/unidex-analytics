import { useContext, useMemo } from "react";
import { DataContext } from "../ChartsContainer";
import { ChartWrapper, FilterContext } from "./Wrapper";
import {
  Bar,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getGroupKey, getTopGroups, isFiltered } from "@/utils/data";
import { generateColor, generateGreen, generateRed } from "@/utils/colors";
import { currencyFormatter } from "@/utils/formatter";
import { CustomTooltip } from "./CustomTooltip";

export interface OpenInterestProps {}

export function OpenInterest({}: OpenInterestProps) {
  const { data } = useContext(DataContext);
  const { chainFilter, collateralFilter, groupBy, pairFilter } =
    useContext(FilterContext);

  const transformedData = useMemo(() => {
    if (!data)
      return {
        topGroups: [],
        data: [],
      };

    const totalValue = data.Products.reduce(
      (acc, product) =>
        acc + product.openInterestLongUsd - product.openInterestShortUsd,
      0
    );

    const topGroupLimit =
      groupBy === "pair" ? 4 : groupBy === "collateral" ? 4 : undefined;

    const topGroups = getTopGroups({
      chainFilter,
      collateralFilter,
      data,
      groupBy,
      pairFilter,
      valueKey: "openInterestUsd",
      topGroupLimit,
    });

    let latestTimestamp = 0;

    const dataMap = data.DayProducts.reduce(
      (acc, dayProduct) => {
        const [pair, collateral, chainId, dayId] = dayProduct._id.split(":");

        if (
          isFiltered({
            chainFilter,
            collateralFilter,
            data,
            pairFilter,
            splitId: [pair, collateral, chainId],
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

        const mappedGroupKey = topGroups.includes(groupKey)
          ? groupKey
          : "Others";

        if (!acc.data[timestamp]) {
          acc.data[timestamp] = {
            timestamp,
            [`Short ${mappedGroupKey}`]: -dayProduct.openInterestShortUsd,
            [`Long ${mappedGroupKey}`]: dayProduct.openInterestLongUsd,
            ["Net Cumulative"]:
              dayProduct.openInterestLongUsd -
              dayProduct.openInterestShortUsd +
              acc.cumulative,
          };
          for (const key of topGroups) {
            if (key !== mappedGroupKey) {
              acc.data[timestamp][`Short ${key}`] = 0;
              acc.data[timestamp][`Long ${key}`] = 0;
            }
          }
        } else {
          if (!acc.data[timestamp][`Short ${mappedGroupKey}`]) {
            acc.data[timestamp][`Short ${mappedGroupKey}`] =
              -dayProduct.openInterestShortUsd;
            acc.data[timestamp][`Long ${mappedGroupKey}`] =
              dayProduct.openInterestLongUsd;
          } else {
            acc.data[timestamp][`Short ${mappedGroupKey}`] -=
              dayProduct.openInterestShortUsd;
            acc.data[timestamp][`Long ${mappedGroupKey}`] +=
              dayProduct.openInterestLongUsd;
          }
          acc.data[timestamp]["Net Cumulative"] +=
            dayProduct.openInterestLongUsd - dayProduct.openInterestShortUsd;
        }

        acc.cumulative +=
          dayProduct.openInterestLongUsd - dayProduct.openInterestShortUsd;

        return acc;
      },
      {
        data: {} as Record<
          number,
          Record<string, number> & { timestamp: number }
        >,
        cumulative: 0,
      }
    );

    const values = Object.values(dataMap.data).map((item) => {
      item["Net Cumulative"] =
        item["Net Cumulative"] + totalValue - dataMap.cumulative;
      return item;
    });

    return {
      topGroups,
      data: values,
    };
  }, [data, chainFilter, collateralFilter, groupBy, pairFilter]);

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
          interval={"equidistantPreserveStart"}
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
        />
        <Tooltip
          content={({ active, payload, label }) => {
            const total = payload
              ?.filter((item) => item.name !== "Net Cumulative")
              .reduce((acc, item) => acc + Number(item.value), 0);
            return (
              <CustomTooltip
                total={total}
                active={active}
                payload={payload}
                label={label}
                totalTitle="Net Total"
              />
            );
          }}
        />
        {transformedData.topGroups.map((group, i) => (
          <>
            <Bar
              dataKey={`Short ${group}`}
              key={`Short ${group}`}
              stackId={"a"}
              fill={generateRed(i)}
              yAxisId="left"
              isAnimationActive={false}
            />
            <Bar
              dataKey={`Long ${group}`}
              key={`Long ${group}`}
              stackId={"a"}
              fill={generateGreen(i)}
              yAxisId="left"
              isAnimationActive={false}
            />
          </>
        ))}
        <Line
          type="monotone"
          dataKey="Net Cumulative"
          stroke="#8884d8"
          yAxisId="right"
          isAnimationActive={false}
        />
        <ReferenceLine y={0} yAxisId={"left"} stroke="#666" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
