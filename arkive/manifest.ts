import { createTradingContractConfig } from "./config/contract.ts";
import { sources } from "./config/sources.ts";
import { Manifest } from "./deps.ts";
import { DayProduct } from "./entities/day-product.ts";
import { HourPrice } from "./entities/hour-price.ts";
import { Position } from "./entities/position.ts";
import { Product } from "./entities/product.ts";
import { TokenInfo } from "./entities/token-info.ts";
import { Trade } from "./entities/trade.ts";
import { User } from "./entities/user.ts";

export default new Manifest("unidex")
  .addEntities([
    Position,
    Product,
    Trade,
    DayProduct,
    TokenInfo,
    HourPrice,
    User,
  ])
  .addChain("arbitrum", (chain) =>
    chain
      .addContract(createTradingContractConfig(sources.arbitrum)))
  .addChain("optimism", (chain) =>
    chain
      .setOptions({ rpcUrl: "https://rpc.ankr.com/optimism" })
      .addContract(createTradingContractConfig(sources.optimism)))
  .addChain("fantom", (chain) =>
    chain
      .addContract(createTradingContractConfig(sources.fantom)))
  .addChain(
    "zksync",
    (chain) =>
      chain.setOptions({ rpcUrl: "https://mainnet.era.zksync.io" }).addContract(
        createTradingContractConfig(sources.zksync),
      ),
  )
  .addChain(
    "base",
    (chain) =>
      chain.setOptions({ rpcUrl: "https://mainnet.base.org" }).addContract(
        createTradingContractConfig(sources.base),
      ),
  )
  .build();
