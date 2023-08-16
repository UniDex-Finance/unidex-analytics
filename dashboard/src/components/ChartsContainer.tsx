import { QueryClientProvider } from "@tanstack/react-query"
import { client } from "../stores/query-client"
import { VolumeChart } from "./charts/Volume"

export const ChartsContainer = () => {
	return (
		<QueryClientProvider client={client}>
			<VolumeChart />
		</QueryClientProvider>
	)
}