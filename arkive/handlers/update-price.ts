import { chainIdToCoingeckoId } from "../config/coingecko-networks.ts";
import { BlockHandler } from "../deps.ts";
import { Data } from "../entities/data.ts";
import { HourPrice } from "../entities/hour-price.ts";
import { fetchPrices } from "../utils/prices.ts";

export const updatePrice: BlockHandler = async (ctx) => {
  /**
   * High-level overview:
   * 1. Get all collateral tokens from data entity
   * 2. For each collateral, do the following:
   * 3. Get the latest hour timestamp from hour-price entity
   * 4. If hour timestamp is null, fetch all hour prices from the data entity's createdAtTimestamp to the latest hour
   * 5. if hour timestamp is not null, check if the current block hour is more or equal than the latest hour
   * 6. If it is, fetch all hour prices from the latest hour to the current block hour
   * 7. For each hour price, save it to the hour-price entity
   */

  const currentBlockHour = (ctx.block.timestamp / 3600n) * 3600n; // current block hour rounded down

  const datas = await Data.find({});

  const prices = await Promise.all(datas.map(async (data) => {
    const [currency, chainId] = data._id.split(":");

    const latestPrice = await HourPrice.findOne({
      currency,
      chainId,
    }).sort({ hourTimestamp: -1 });

    if (!latestPrice) {
      const from = data.createdAtTimestamp - (data.createdAtTimestamp % 86_400); // day of pool creation
      const to = Math.floor(Date.now() / 1000); // current timestamp
      const prices = await fetchPrices({
        currency,
        chainId: parseInt(chainId) as keyof typeof chainIdToCoingeckoId,
        from,
        to,
      });
      return prices;
    }

    if (currentBlockHour < BigInt(latestPrice.hourTimestamp)) return [];

    const prices = await fetchPrices({
      currency,
      chainId: parseInt(chainId) as keyof typeof chainIdToCoingeckoId,
      from: latestPrice.hourTimestamp,
      to: Number(currentBlockHour + 3600n), // current block hour rounded up
    });

    return prices.map((price) =>
      new HourPrice({
        _id: `${currency}:${chainId}:${price.timestamp}`,
        chainId,
        currency,
        hourTimestamp: price.timestamp,
        priceUsd: price.price,
      })
    );
  }));

  await HourPrice.insertMany(prices.flat());
};
