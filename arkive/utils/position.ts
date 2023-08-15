import { Store } from "../deps.ts";
import { Position } from "../entities/position.ts";

export const getPosition = async (
  params: { key: string; store: Store; chainId: number; productId: string },
) => {
  const { store, key, chainId, productId } = params;

  let isNewPosition = false;

  const id = `${key}:${chainId}`;

  const position = await store.retrieve(
    `position:${id}`,
    async () => {
      const position = await Position.findOne({ _id: id });
      if (!position) {
        isNewPosition = true;
        return new Position({
          _id: id,
          chainId,
          productId,
          leverage: 0,
          price: 0,
          margin: 0,
          fee: 0,

          size: 0,
          liquidationPrice: 0,

          user: "",
          currency: "",

          isLong: false,

          createdAtTimestamp: 0,
          createdAtBlockNumber: 0,

          updatedAtTimestamp: 0,
          updatedAtBlockNumber: 0,
        });
      }
      return position;
    },
  );

  return { position, isNewPosition };
};

export const savePosition = (params: { store: Store; data: any }) => {
  const { store, data } = params;
  store.set(`position:${data._id}`, data.save().catch(console.error));
};
