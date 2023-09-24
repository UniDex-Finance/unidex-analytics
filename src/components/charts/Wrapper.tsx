import type React from "react";
import { cn } from "../../utils/cn";
import { createContext, useContext, useEffect, useState } from "react";
import { ChartsToolBar } from "./Toolbar";
import { DataContext } from "../ChartsContainer";

type GroupBy = "pair" | "collateral" | "chain";

export const FilterContext = createContext<{
  setGroupBy: React.Dispatch<React.SetStateAction<GroupBy>>;
  groupBy: GroupBy;
  setPairFilter: React.Dispatch<React.SetStateAction<string[]>>;
  setCollateralFilter: React.Dispatch<React.SetStateAction<string[]>>;
  setChainFilter: React.Dispatch<React.SetStateAction<string[]>>;
  pairFilter: string[];
  collateralFilter: string[];
  chainFilter: string[];
  hiddenFilters: {
    pair?: boolean;
    collateral?: boolean;
    chain?: boolean;
  };
}>({
  setGroupBy: () => {},
  groupBy: "pair",
  setPairFilter: () => {},
  setCollateralFilter: () => {},
  setChainFilter: () => {},
  pairFilter: [],
  collateralFilter: [],
  chainFilter: [],
  hiddenFilters: {},
});

export interface ChartWrapperProps {
  children: React.ReactNode;
  title: string;
  defaultPairs?: string[];
  defaultCollaterals?: string[];
  defaultChains?: string[];
  fullWidth?: boolean;
  hiddenFilters?: {
    pair?: boolean;
    collateral?: boolean;
    chain?: boolean;
  };
  defaultGroupBy?: GroupBy;
}

export function ChartWrapper({
  children,
  title,
  defaultChains = [],
  defaultCollaterals = [],
  defaultPairs = [],
  fullWidth,
  hiddenFilters = {},
  defaultGroupBy = "pair",
}: ChartWrapperProps) {
  const { isLoading } = useContext(DataContext);
  const [groupBy, setGroupBy] = useState<"pair" | "collateral" | "chain">(
    defaultGroupBy
  );
  const [pairFilter, setPairFilter] = useState<string[]>(defaultPairs);
  const [collateralFilter, setCollateralFilter] =
    useState<string[]>(defaultCollaterals);
  const [chainFilter, setChainFilter] = useState<string[]>(defaultChains);

  return (
    <div
      className={cn(
        "w-full h-[500px] outline outline-1 outline-slate-700 bg-opacity-10 bg-slate-500 rounded-lg shadow-lg py-2 flex flex-col justify-between",
        {
          ["animate-pulse"]: isLoading,
          ["bg-opacity-20"]: isLoading,
          ["md:col-span-2"]: fullWidth,
        }
      )}
    >
      <FilterContext.Provider
        value={{
          setGroupBy,
          groupBy,
          chainFilter,
          collateralFilter,
          pairFilter,
          setChainFilter,
          setCollateralFilter,
          setPairFilter,
          hiddenFilters,
        }}
      >
        <ChartsToolBar title={title} />
        {children}
      </FilterContext.Provider>
    </div>
  );
}
