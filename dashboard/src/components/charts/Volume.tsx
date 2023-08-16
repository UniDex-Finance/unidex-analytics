import { useQuery } from "@tanstack/react-query"
import { ResponsiveContainer, Line, ComposedChart, Area, Bar, CartesianGrid, Legend, Scatter, Tooltip, XAxis, YAxis } from "recharts"
import { useEffect, useMemo } from "react"
import { getStats } from "../../queries/stats"
import { cn } from "../../utils/cn"
import { ChartWrapper } from "./Wrapper"

export const VolumeChart = () => {
	const { isLoading, isError, data } = useQuery({
		queryKey: ["stats"],
		queryFn: getStats,
	})

	const transformedData = useMemo(() => {
		if (!data) return []
		return data
	}, [data])

	return (
		<ChartWrapper title="Total Volume" isError={isError} isLoading={isLoading}>
			<ResponsiveContainer width="100%" height="90%" className={cn({ ["invisible"]: isError || isLoading })}>
				<ComposedChart data={transformedData}>
					<CartesianGrid stroke="#f5f5f5" />
					<XAxis dataKey="name" scale="band" />
					<YAxis />
					<Tooltip />
					<Legend />
					<Area type="monotone" dataKey="amt" fill="#8884d8" stroke="#8884d8" />
					<Bar dataKey="pv" barSize={20} fill="#413ea0" />
					<Line type="monotone" dataKey="uv" stroke="#ff7300" />
					<Scatter dataKey="cnt" fill="red" />
				</ComposedChart>
			</ResponsiveContainer>
		</ChartWrapper>
	)
}