import { Bar } from "recharts";
import { getGroupKey, getTopGroups, isFiltered } from "@/utils/data";
import { generateGreen, generateRed } from "@/utils/colors";
import {
  MixedBarCumLineChart,
  MixedBarCumLineChartProps,
} from "./MixedBarCumLine";

export interface OpenInterestProps {}

export function OpenInterest({}: OpenInterestProps) {
  const transformer: MixedBarCumLineChartProps["transformer"] = ({
    chainFilter,
    collateralFilter,
    data,
    groupBy,
    pairFilter,
  }) => {
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
          if (
            !acc.data[timestamp][`Short ${mappedGroupKey}`] ||
            !acc.data[timestamp][`Long ${mappedGroupKey}`]
          ) {
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
  };

  return (
    <MixedBarCumLineChart
      barsMapper={(group, i) => (
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
      )}
      lineKey="Net Cumulative"
      transformer={transformer}
    />
  );
}
