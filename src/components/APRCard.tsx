import { useContext } from "react";
import { DataContext } from "./ChartsContainer";
import { cn } from "@/utils/cn";

export interface APRStatCardProps {
  title: string;
  apr: string;
}

export function APRStatCard({ title, apr }: APRStatCardProps) {
  const { isLoading } = useContext(DataContext);

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
        {apr}
      </p>
    </div>
  );
}
