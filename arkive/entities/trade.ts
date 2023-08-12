export interface Trade {
  txHash: string;

  positionKey: string;

  user: string;
  currency: string;

  productId: string;
  margin: string;
  leverage: string;

  size: string;

  entryPrice: string;
  closePrice: string;

  isLong: boolean;

  fee: string;
  pnl: string;

  wasLiquidated: boolean;
  isFullClose: boolean;

  duration: number;

  timestamp: number;
  blockNumber: number;
}
