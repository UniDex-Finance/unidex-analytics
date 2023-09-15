import {
  chainIdToCoingeckoId,
  chainNativeWrappedTokens,
} from "../config/coingecko-networks.ts";
import { TokenInfo } from "../entities/token-info.ts";
import {
  array,
  BlockHandler,
  number,
  object,
  safeParse,
  Store,
  string,
  tuple,
  zeroAddress,
} from "../deps.ts";
import { HourPrice } from "../entities/hour-price.ts";

export const fetchPrices = async (params: {
  currency: string;
  chainId: keyof typeof chainIdToCoingeckoId;
  from: number;
  to: number;
  logger: Parameters<BlockHandler>[0]["logger"];
}) => {
  const { currency, chainId, from, to } = params;

  const prices = await fetchPricesFromCoingecko({
    chainId,
    currency,
    from,
    to,
    logger: params.logger,
  });

  return prices;
};

export const fetchPricesFromCoingecko = async (params: {
  chainId: keyof typeof chainIdToCoingeckoId;
  currency: string;
  from: number;
  to: number;
  logger: Parameters<BlockHandler>[0]["logger"];
}) => {
  const tokenInfo = await fetchTokenInfo({
    chainId: params.chainId,
    currency: params.currency,
    logger: params.logger,
  });

  if (!tokenInfo) return [];

  const fetchPricesBefore = async (timestamp: number) => {
    const url =
      `https://api.geckoterminal.com/api/v2/networks/${tokenInfo.coingeckoChainId}/pools/${tokenInfo.poolAddress}/ohlcv/hour?aggregate=1&before_timestamp=${timestamp}&limit=1000&currency=usd&token=${
        tokenInfo.poolIsInBase ? "base" : "quote"
      }`;
    const priceRes = await fetch(url);
    if (!priceRes.ok) {
      params.logger.error(
        `Failed to fetch prices from coingecko ${priceRes.status}: ${priceRes.statusText}`,
      );
      return [];
    }
    const priceDataParseRes = safeParse(
      coingeckoPriceSchema,
      await priceRes.json(),
    );
    if (!priceDataParseRes.success) {
      params.logger.error(
        `Failed to parse price data from coingecko ${
          JSON.stringify(priceDataParseRes.error, null, 2)
        }`,
      );
      return [];
    }
    const priceData = priceDataParseRes.data;
    const averagePrices = priceData.data.attributes.ohlcv_list.map(
      ([timestamp, open, _high, _low, close]) => {
        return {
          timestamp,
          price: (open + close) / 2,
        };
      },
    );
    return averagePrices;
  };
  const prices: { timestamp: number; price: number }[] = [];

  while (params.to > params.from) {
    const averagePrices = await fetchPricesBefore(params.to);
    if (averagePrices.length === 0) break;
    await new Promise((r) => setTimeout(r, 1000)); // Avoid rate limiting
    prices.push(...averagePrices);
    params.to = averagePrices[averagePrices.length - 1].timestamp;
  }

  return prices;
};

const fetchTokenInfo = async (params: {
  chainId: keyof typeof chainIdToCoingeckoId;
  currency: string;
  logger: Parameters<BlockHandler>[0]["logger"];
}) => {
  let tokenInfo = await TokenInfo.findOne({
    chainId: params.chainId,
    currency: params.currency,
  }).lean();

  if (!tokenInfo) {
    let mappedCurrency = params.currency;
    let poolChainId = params.chainId;
    if (params.currency === zeroAddress) {
      const { address, chainId } = chainNativeWrappedTokens[params.chainId];
      mappedCurrency = address;
      poolChainId = chainId;
    }
    const coingeckoId = chainIdToCoingeckoId[poolChainId];
    const tokenRes = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/${coingeckoId}/tokens/${mappedCurrency}?include=top_pools`,
    );
    if (!tokenRes.ok) {
      params.logger.error(
        `Failed to fetch token from coingecko: ${tokenRes.status} ${tokenRes.statusText}`,
      );
      return null;
    }
    const tokenParseRes = safeParse(
      coingeckoTokenSchema,
      await tokenRes.json(),
    );
    if (!tokenParseRes.success) {
      params.logger.error(
        `Failed to parse token from coingecko: ${
          JSON.stringify(tokenParseRes.error)
        }`,
      );
      return null;
    }
    const token = tokenParseRes.data;
    const pool = token.included.find((i) =>
      i.attributes.name.split(" / ").length < 3
    );
    if (!pool) return null;
    tokenInfo = {
      _id: `${params.currency}:${params.chainId}`,
      chainId: params.chainId,
      coingeckoChainId: coingeckoId,
      currency: params.currency,
      mappedCurrency,
      decimals: token.data.attributes.decimals,
      name: token.data.attributes.name,
      symbol: token.data.attributes.symbol,
      poolAddress: pool.attributes.address,
      poolChainId,
      poolIsInBase: pool.relationships.base_token.data.id.split("_")[1]
        .toLowerCase() === mappedCurrency.toLowerCase(),
      createdAtTimestamp: Math.floor(Date.now() / 1000),
    };
    await TokenInfo.create(tokenInfo);
  }

  return tokenInfo;
};

export const getPrice = async (params: {
  currency: string;
  chainId: keyof typeof chainIdToCoingeckoId;
  timestamp: number;
  store: Store;
  logger: Parameters<BlockHandler>[0]["logger"];
}) => {
  const hourTimestamp = params.timestamp - (params.timestamp % 3600);

  const id = `${params.currency}:${params.chainId}:${hourTimestamp}`;

  const price = await params.store.retrieve(`price:${id}`, async () => {
    const price = await HourPrice.findOne({ _id: id });
    if (price === null) {
      const nowHour = (Date.now() - (Date.now() % 3600000)) / 1000;

      const [higher, lower] = await Promise.all([
        HourPrice.findOne({
          currency: params.currency,
          chainId: params.chainId,
          hourTimestamp: { $gt: hourTimestamp },
        }).sort({ hourTimestamp: 1 }),
        HourPrice.findOne({
          currency: params.currency,
          chainId: params.chainId,
          hourTimestamp: { $lt: hourTimestamp },
        }).sort({ hourTimestamp: -1 }),
      ]);

      if (!higher && !lower) return null;

      if (!higher || !lower) {
        return higher ? higher.priceUsd : lower!.priceUsd;
      }

      const closest = Math.abs(higher.hourTimestamp - hourTimestamp) <
          Math.abs(lower.hourTimestamp - hourTimestamp)
        ? higher
        : lower;

      if (hourTimestamp >= nowHour) {
        const closestDiff = Math.abs(closest.hourTimestamp - hourTimestamp);
        if (closestDiff > 3600) {
          params.logger.info(
            `Price not found for ${params.currency} on ${params.chainId} at ${hourTimestamp} and ${hourTimestamp} is more than ${nowHour}`,
          );
          return null;
        }
      } // Fetch prices from coingecko once fully synced

      return closest.priceUsd;
    }

    return price.priceUsd;
  });

  if (price !== null) return price;

  const prices = await fetchPrices({
    chainId: params.chainId,
    currency: params.currency,
    from: hourTimestamp,
    to: (Date.now() / 1000) - ((Date.now() / 1000) % 3600),
    logger: params.logger,
  });

  if (prices.length === 0) {
    params.logger.error(
      `No prices returned for ${params.currency} on ${params.chainId} from coingecko at ${hourTimestamp}`,
    );
    return null;
  }

  try {
    await HourPrice.insertMany(prices.map((price) =>
      new HourPrice({
        _id: `${params.currency}:${params.chainId}:${price.timestamp}`,
        chainId: params.chainId,
        currency: params.currency,
        hourTimestamp: price.timestamp,
        priceUsd: price.price,
      })
    ));
  } catch (e) {
    params.logger.error(e);
  }

  let newPrice = prices.find((price) => price.timestamp === hourTimestamp)
    ?.price;

  if (newPrice === undefined) {
    let closest = prices[0];
    for (const price of prices) {
      if (
        Math.abs(price.timestamp - hourTimestamp) <
          Math.abs(closest.timestamp - hourTimestamp)
      ) {
        closest = price;
      } else {
        break;
      }
    }
    newPrice = closest.price;
  }

  params.store.set(
    `price:${id}`,
    newPrice,
  );

  return newPrice;
};

const coingeckoTokenSchema = object({
  data: object({
    attributes: object({
      name: string(),
      symbol: string(),
      decimals: number(),
    }),
  }),
  included: array(object({
    attributes: object({
      address: string(),
      name: string(),
    }),
    relationships: object({
      base_token: object({
        data: object({
          id: string(),
        }),
      }),
      quote_token: object({
        data: object({
          id: string(),
        }),
      }),
    }),
  })),
});

const coingeckoPriceSchema = object({
  data: object({
    attributes: object({
      ohlcv_list: array(
        tuple([number(), number(), number(), number(), number(), number()]),
      ),
    }),
  }),
});
