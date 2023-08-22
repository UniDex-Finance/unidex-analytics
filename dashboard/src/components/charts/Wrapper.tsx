import type React from "react";
import { cn } from "../../utils/cn";

export type ChartWrapperProps = {
  children: React.ReactNode;
};

export const ChartWrapper = ({ children }: ChartWrapperProps) => {
  return (
    <div className="w-full h-[500px] outline outline-1 outline-slate-700 bg-opacity-10 bg-slate-500 rounded-lg shadow-lg py-2 flex flex-col justify-center gap-4">
      {children}
    </div>
  );
};
