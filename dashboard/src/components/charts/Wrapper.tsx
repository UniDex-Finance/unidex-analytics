import type React from "react";
import { cn } from "../../utils/cn"

export type ChartWrapperProps = {
	title: string;
	children: React.ReactNode;
	isLoading: boolean;
	isError: boolean;
};

export const ChartWrapper = ({ title, children, isError, isLoading }: ChartWrapperProps) => {
	return (
		<div className={cn("w-full h-[500px] outline outline-1 outline-slate-700 bg-opacity-10 bg-slate-500 rounded-lg shadow-lg pt-4 pb-2 pr-6 flex flex-col justify-between", { ["animate-pulse"]: isError || isLoading })}>
			<h2 className="w-full text-center text-xl">{title}</h2>
			{children}
		</div>
	)
}