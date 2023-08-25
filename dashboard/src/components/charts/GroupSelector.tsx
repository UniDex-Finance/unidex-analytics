import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContext } from "react";
import { FilterContext } from "./Wrapper";

export interface SelectorProps {
  setter: (value: string) => void;
  value: string;
}

export function GroupSelector({ setter, value }: SelectorProps) {
  const { hiddenFilters } = useContext(FilterContext);
  return (
    <Select onValueChange={setter} value={value}>
      <SelectTrigger className="md:w-[180px] w-auto h-8" name="Group Stats By">
        <SelectValue placeholder="Group by" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Group By</SelectLabel>
          {!hiddenFilters.pair && <SelectItem value="pair">Pair</SelectItem>}
          {!hiddenFilters.collateral && (
            <SelectItem value="collateral">Collateral</SelectItem>
          )}
          {!hiddenFilters.chain && <SelectItem value="chain">Chain</SelectItem>}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
