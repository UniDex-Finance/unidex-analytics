import type React from "react";
import { cn } from "../../utils/cn";

export type ChartWrapperProps = {
  children: React.ReactNode;
  isLoading?: boolean;
};

export const ChartWrapper = ({ children, isLoading }: ChartWrapperProps) => {
  return (
    <div
      className={cn(
        "w-full h-[500px] outline outline-1 outline-slate-700 bg-opacity-10 bg-slate-500 rounded-lg shadow-lg py-2 flex flex-col justify-between",
        {
          ["animate-pulse"]: isLoading,
          ["bg-opacity-20"]: isLoading,
        }
      )}
    >
      {children}
    </div>
  );
};
