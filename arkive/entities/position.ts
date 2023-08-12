export interface Position {
  productId: string;
  leverage: string;
  price: string;
  margin: string;
  fee: string;

  size: string;
  liquidationPrice: string;

  user: string;
  currency: string;

  isLong: boolean;

  createdAtTimestamp: number;
  createdAtBlockNumber: number;

  updatedAtTimestamp: number;
  updatedAtBlockNumber: number;
}
