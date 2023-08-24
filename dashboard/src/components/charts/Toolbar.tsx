import { getChainName } from "@/utils/chains";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Separator } from "@/components/ui/separator";
import { Filter } from "./Filter";
import { GroupSelector } from "./GroupSelector";
import { Button } from "../ui/button";
import { useContext, useEffect } from "react";
import { FilterContext } from "./Wrapper";
import { DataContext } from "../ChartsContainer";

export interface ChartsToolBarProps {
  title: string;
}

export function ChartsToolBar({ title }: ChartsToolBarProps) {
  const {
    setGroupBy,
    chainFilter,
    collateralFilter,
    groupBy,
    pairFilter,
    setChainFilter,
    setCollateralFilter,
    setPairFilter,
  } = useContext(FilterContext);
  const { allChains, allCollaterals, allPairs } = useContext(DataContext);

  return (
    <div>
      <div className="flex items-center gap-2 px-4 pb-2 flex-wrap">
        <h2 className="text-xl flex-1">{title}</h2>
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
  );
}
