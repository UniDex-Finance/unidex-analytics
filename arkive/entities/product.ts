export interface Product {
  cumulativeFees: string;
  cumulativePnl: string;
  cumulativeVolume: string;
  cumulativeMargin: string;

  positionCount: number;
  tradeCount: number;

  openInterest: string;
  openInterestLong: string;
  openInterestShort: string;
}
