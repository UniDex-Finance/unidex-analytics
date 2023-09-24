import { currencyFormatter } from "@/utils/formatter";
import type { TooltipProps } from "recharts";

export interface CustomTooltipProps<
  TValue extends (string | number)[] | string | number,
  TName extends number | string
> extends TooltipProps<TValue, TName> {
  total?: number;
  totalTitle?: string;
  numberFormatter?: Intl.NumberFormat;
}

export function CustomTooltip<
  TValue extends (string | number)[] | string | number,
  TName extends number | string
>({
  label,
  active,
  payload,
  total,
  totalTitle,
  numberFormatter,
}: CustomTooltipProps<TValue, TName>) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-center">
        {new Date(Number(label) * 1000).toLocaleDateString("en-US", {
          dateStyle: "short",
        })}
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
                {numberFormatter
                  ? numberFormatter.format(Number(item.value))
                  : currencyFormatter.format(Number(item.value))}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "#8884d8" }}
            />
            <div className="flex-1 font-bold">{totalTitle ?? "Total"}</div>
            <div className="font-bold">
              {numberFormatter
                ? numberFormatter.format(total ?? 0)
                : currencyFormatter.format(total ?? 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
