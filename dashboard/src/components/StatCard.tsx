import { useContext, useState, useEffect } from "react";
import { DataContext } from "./ChartsContainer";
import { cn } from "@/utils/cn";
import type { StatsRaw } from "@/queries/stats";
import { currencyFormatter } from "@/utils/formatter";

export interface StatCardProps {
  title: string;
  valueKey:
    | Exclude<keyof StatsRaw["data"]["Products"][number], "_id">
    | "usersCount";
  formatter?: Intl.NumberFormat;
}

export function StatCard({ title, valueKey, formatter }: StatCardProps) {
  const { data, isLoading } = useContext(DataContext);
  const [value, setValue] = useState("...");

  useEffect(() => {
    if (!data) return;

    if (valueKey === "usersCount") {
      setValue(data.UsersCount.toString());
      return;
    }

    const rawValue = data.Products.reduce(
      (acc, product) => acc + product[valueKey],
      0
    );

    const formattedValue = formatter
      ? formatter.format(rawValue)
      : currencyFormatter.format(rawValue);

    setValue(formattedValue);
  }, [data, valueKey]);

  return (
    <div
      className={cn(
        "w-full flex flex-col gap-1 justify-center outline outline-1 outline-slate-700 bg-opacity-10 bg-slate-500 rounded-lg shadow-lg py-4 px-6",
        {
          ["animate-pulse"]: isLoading,
          ["bg-opacity-20"]: isLoading,
        }
      )}
    >
      <h2 className="text-xl text-slate-400">{title}</h2>
      <p
        className={cn("text-3xl font-bold", {
          ["animate-bounce"]: isLoading,
        })}
      >
        {value}
      </p>
    </div>
  );
}
