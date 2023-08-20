import { QueryClientProvider } from "@tanstack/react-query";
import { client } from "../stores/query-client";
import { VolumeChart } from "./charts/Volume";

export const ChartsContainer = () => {
  return (
    <QueryClientProvider client={client}>
      <VolumeChart groupBy="pair" showOthers />
      <VolumeChart groupBy="collateral" topGroupLimit={4} showOthers />
      <VolumeChart groupBy="chain" />
    </QueryClientProvider>
  );
};
