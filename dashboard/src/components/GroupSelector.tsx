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

export interface SelectorProps {
  setter: (value: string) => void;
  value: string;
}

export function GroupSelector({ setter, value }: SelectorProps) {
  return (
    <Select onValueChange={setter} value={value}>
      <SelectTrigger className="w-[180px] h-8">
        <SelectValue placeholder="Group by" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Group By</SelectLabel>
          <SelectItem value="pair">Pair</SelectItem>
          <SelectItem value="collateral">Collateral</SelectItem>
          <SelectItem value="chain">Chain</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
