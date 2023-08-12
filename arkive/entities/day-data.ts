export interface DayData {
  date: number;
  cumulativeFees: string;
  cumulativePnl: string;
  cumulativeVolume: string;
  cumulativeMargin: string;

  openInterest: string;
  openInterestLong: string;
  openInterestShort: string;

  positionCount: number;
  tradeCount: number;
}
