import { Bar } from "recharts";
import { getGroupKey, isFiltered } from "@/utils/data";
import { generateGreen, generateRed } from "@/utils/colors";
import {
  MixedBarCumLineChart,
  type MixedBarCumLineChartProps,
} from "./MixedBarCumLine";
import { useContext } from "react";
import { DataContext } from "../ChartsContainer";

export interface OpenInterestProps {}

export function OpenInterest({}: OpenInterestProps) {
  const transformer: MixedBarCumLineChartProps["transformer"] = ({
    chainFilter,
    collateralFilter,
    data,
    groupBy,
    pairFilter,
  }) => {
    const { isCurrent } = useContext(DataContext);

    const totalValue = (isCurrent ? data.Products : data.DayProducts).reduce(
      (acc, product) =>
        acc + product.openInterestLongUsd - product.openInterestShortUsd,
      0
    );

    const topGroupLimit =
      groupBy === "pair" ? 4 : groupBy === "collateral" ? 4 : undefined;

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

        if (!acc.data[timestamp]) {
          acc.data[timestamp] = {
            timestamp,
            [`Short ${groupKey}`]: -dayProduct.openInterestShortUsd,
            [`Long ${groupKey}`]: dayProduct.openInterestLongUsd,
            ["Net Cumulative"]:
              dayProduct.openInterestLongUsd -
              dayProduct.openInterestShortUsd +
              acc.cumulative,
          };
        } else {
          if (
            !acc.data[timestamp][`Short ${groupKey}`] ||
            !acc.data[timestamp][`Long ${groupKey}`]
          ) {
            acc.data[timestamp][`Short ${groupKey}`] =
              -dayProduct.openInterestShortUsd;
            acc.data[timestamp][`Long ${groupKey}`] =
              dayProduct.openInterestLongUsd;
          } else {
            acc.data[timestamp][`Short ${groupKey}`] -=
              dayProduct.openInterestShortUsd;
            acc.data[timestamp][`Long ${groupKey}`] +=
              dayProduct.openInterestLongUsd;
          }
          acc.data[timestamp]["Net Cumulative"] +=
            dayProduct.openInterestLongUsd - dayProduct.openInterestShortUsd;
        }

        acc.cumulative +=
          dayProduct.openInterestLongUsd - dayProduct.openInterestShortUsd;

        acc.allKeys.add(groupKey);

        return acc;
      },
      {
        data: {} as Record<
          number,
          Record<string, number> & { timestamp: number }
        >,
        cumulative: 0,
        allKeys: new Set<string>(),
      }
    );

    const values = Object.values(dataMap.data).map((item) => {
      const longSorted = Object.entries(item)
        .filter(
          ([key]) =>
            key !== "timestamp" &&
            key !== "Net Cumulative" &&
            key.includes("Long")
        )
        .sort((a, b) => {
          return b[1] - a[1];
        });
      const topLongGroups = longSorted.slice(0, topGroupLimit);

      const shortSorted = Object.entries(item)
        .filter(
          ([key]) =>
            key !== "timestamp" &&
            key !== "Net Cumulative" &&
            key.includes("Short")
        )
        .sort((a, b) => {
          return Math.abs(b[1]) - Math.abs(a[1]);
        });
      const topShortGroups = shortSorted.slice(0, topGroupLimit);

      const newItem = {
        ...Object.fromEntries(topLongGroups),
        ...Object.fromEntries(topShortGroups),
        ["Net Cumulative"]:
          item["Net Cumulative"] + totalValue - dataMap.cumulative,
        timestamp: item.timestamp,
      } as Record<string, number> & { timestamp: number };

      if (topGroupLimit) {
        const longOthers = longSorted
          .slice(topGroupLimit)
          .reduce((acc, [_, value]) => acc + value, 0);
        const shortOthers = shortSorted
          .slice(topGroupLimit)
          .reduce((acc, [_, value]) => acc + value, 0);

        longOthers > 0 && (newItem["Long Others"] = longOthers);
        shortOthers < 0 && (newItem["Short Others"] = shortOthers);
      }

      return newItem;
    });

    return {
      topGroups: Array.from(dataMap.allKeys).concat("Others"),
      data: values,
    };
  };

  return (
    <MixedBarCumLineChart
      barsMapper={(group, i) => {
        return (
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
        );
      }}
      lineKey="Net Cumulative"
      transformer={transformer}
    />
  );
}
