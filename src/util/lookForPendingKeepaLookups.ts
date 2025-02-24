import { getKeepaEanProgressPerShop } from "../db/util/getEanKeepaProgress.js";
import { getKeepaProgressPerShop } from "../db/util/getKeepaProgress.js";
import { KEEPA_PRODUCT_LIMIT, KEEPA_RATE_LIMIT, MIN_FLIPS_PRODUCTS } from "../constants.js";
import { lockProductsForKeepa } from "../db/util/crudProducts.js";
import {
  keepaEanTaskRecovery,
  keepaTaskRecovery,
} from "../db/util/getKeepaRecovery.js";
import { updateTaskWithQuery } from "../db/util/updateTask.js";
import { CJ_LOGGER, logGlobal } from "./logger.js";
import { PendingShop } from "../types/shops.js";
import { KeepaTaskType, ProductWithTask } from "../types/products.js";
import { DbProductRecord, Shop, WithId } from "@dipmaxtech/clr-pkg";
import { getProductsCol } from "../db/mongo.js";
import { Filter } from "mongodb";
import { keepaEanProps } from "./keepaProps.js";

const loggerName = CJ_LOGGER.PENDING_KEEPAS;

export async function keepaSalesProcess() {
  const col = await getProductsCol();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const query: Filter<DbProductRecord> = {
    $and: [
      {
        createdAt: {
          $gte: today.toISOString(),
        },
      },
      { sdmn: "sales" },
      { info_prop: "missing" },
      { keepaUpdatedAt: { $exists: false } },
    ],
  };

  const salesProducts = (await col
    .aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$eanList", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
      { $limit: KEEPA_PRODUCT_LIMIT },
    ])
    .toArray()) as unknown as DbProductRecord[];

  if (salesProducts.length) {
    return salesProducts.map((product) => {
      return {
        ...product,
        taskType: KeepaTaskType.KEEPA_SALES,
      };
    });
  }

  return [];
}
export async function keepaNormalProcess({
  activeShops,
}: {
  activeShops: WithId<Shop>[];
}) {
  const keepaProgressPerShop = await getKeepaProgressPerShop(activeShops);
  const recoveryShops = await keepaTaskRecovery(activeShops);
  const pleaseRecover = recoveryShops.some((p) => p.pending > 0);

  const pendingProducts = pleaseRecover
    ? recoveryShops.reduce((acc, shop) => {
        return acc + shop.pending;
      }, 0)
    : keepaProgressPerShop.reduce((acc, shop) => {
        return acc + shop.pending;
      }, 0);

  pleaseRecover &&
    logGlobal(loggerName, `Recover keepa task: ${pleaseRecover}`);
  const products = await prepareProducts(
    pleaseRecover ? recoveryShops : keepaProgressPerShop,
    false,
    pleaseRecover
  );
  if (products.length) {
    return products.flatMap((ps) => ps);
  }
  return [];
}
export async function keepaWholesaleProcess() {
  const col = await getProductsCol();

  const query: Filter<DbProductRecord> = {
    a_lookup_pending: true,
    a_status: "keepa",
    target: "a",
  };

  const wholeSaleProducts = await col
    .find(query)
    .limit(KEEPA_PRODUCT_LIMIT)
    .toArray();

  if (wholeSaleProducts.length) {
    logGlobal(
      loggerName,
      `Keepa Wholesale products: ${wholeSaleProducts.length}`
    );
    return wholeSaleProducts.map((product) => {
      return {
        ...product,
        taskType: KeepaTaskType.KEEPA_WHOLESALE,
      };
    });
  }

  return [];
}
export async function keepaNewProcess() {
  const col = await getProductsCol();
  const { updatedAt } = keepaEanProps;
  const query: Filter<DbProductRecord> = {
    $and: [
      { info_prop: "missing" },
      { eanList: { $exists: true, $ne: [] } },
      {
        $or: [
          { [updatedAt]: { $exists: false } },
          {
            [updatedAt]: {
              $lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            },
          },
        ],
      },
    ],
  };
  const newProducts = (await col
    .aggregate([
      {
        $match: query,
      },
      { $sort: { createdAt: -1, info_prop: 1 } },
      { $group: { _id: "$eanList", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
      { $limit: KEEPA_PRODUCT_LIMIT },
    ])
    .toArray()) as unknown as DbProductRecord[];

  if (newProducts.length) {
    return newProducts.map((product) => {
      return {
        ...product,
        taskType: KeepaTaskType.KEEPA_NEW,
      };
    });
  }

  return [];
}

export async function keepaFlipsProcess() {
  const col = await getProductsCol();
  const { updatedAt } = keepaEanProps;
  const newProducts = (await col
    .aggregate([
      {
        $match: {
          $and: [
            { a_avg_fld: "avg30_buyBoxPrice" },
            { a_avg_price: { $gt: 1 } },
            { a_prc: { $gt: 1 } },
            {
              keepaUpdatedAt: {
                $lte: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
              },
            },
          ],
        },
      },
      { $group: { _id: { field2: "$asin" }, document: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$document" } },
      {
        $addFields: {
          a_avg_prc: "$a_avg_price",
          curr_prc: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $gt: ["$curr_ahsprcs", -1] },
                      { $gt: ["$curr_ansprcs", -1] },
                    ],
                  },
                  then: { $min: ["$curr_ahsprcs", "$curr_ansprcs"] },
                },
                {
                  case: {
                    $and: [
                      { $eq: ["$curr_ahsprcs", -1] },
                      { $gt: ["$curr_ansprcs", -1] },
                    ],
                  },
                  then: "$curr_ansprcs",
                },
                {
                  case: {
                    $and: [
                      { $eq: ["$curr_ansprcs", -1] },
                      { $gt: ["$curr_ahsprcs", -1] },
                    ],
                  },
                  then: "$curr_ahsprcs",
                },
              ],
              default: null,
            },
          },
        },
      },
      {
        $addFields: {
          "costs.azn": {
            $round: [
              {
                $multiply: [
                  { $divide: ["$costs.azn", "$a_prc"] },
                  "$a_avg_prc",
                ],
              },
              2,
            ],
          },
        },
      },
      {
        $addFields: {
          a_mrgn: {
            $round: [
              {
                $subtract: [
                  "$a_avg_prc",
                  {
                    $add: [
                      {
                        $divide: [
                          "$curr_prc",
                          {
                            $add: [
                              1,
                              { $divide: [{ $ifNull: ["$tax", 19] }, 100] },
                            ],
                          },
                        ],
                      },
                      {
                        $subtract: [
                          "$a_avg_prc",
                          {
                            $divide: [
                              "$a_avg_prc",
                              {
                                $add: [
                                  1,
                                  { $divide: [{ $ifNull: ["$tax", 19] }, 100] },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                      "$costs.azn",
                      "$costs.tpt",
                      "$costs.varc",
                      "$costs.strg_1_hy",
                      0,
                    ],
                  },
                ],
              },
              2,
            ],
          },
        },
      },
      {
        $addFields: {
          a_mrgn_pct: {
            $round: [
              { $multiply: [{ $divide: ["$a_mrgn", "$a_avg_prc"] }, 100] },
              2,
            ],
          },
        },
      },
      { $match: { a_mrgn: { $gt: 0 } } },
      {
        $project: {
          sourceDomain: "$shop",
          prc: 1,
          uprc: 1,
          lnk: 1,
          img: 1,
          nm: 1,
          a: 1,
          cur: 1,
          eanList: 1,
          s: 1,
          qty_v: 1,
          nm_v: 1,
          ean: 1,
          availUpdatedAt: 1,
          qty: 1,
          createdAt: 1,
          updatedAt: 1,
          tax: 1,
          shop: "flip",
          _id: 1,
          mnfctr: 1,
          sdmn: 1,
          a_pblsh: 1,
          a_nm: 1,
          a_useCurrPrice: 1,
          a_cur: 1,
          a_rating: 1,
          a_reviewcnt: 1,
          bsr: 1,
          a_img: 1,
          a_avg_price: 1,
          a_avg_fld: 1,
          dealAznUpdatedAt: 1,
          asin: 1,
          a_prc: 1,
          costs: 1,
          a_uprc: 1,
          a_qty: 1,
          a_orgn: 1,
          a_mrgn: 1,
          a_mrgn_pct: 1,
          a_w_mrgn: 1,
          a_w_mrgn_pct: 1,
          a_p_w_mrgn: 1,
          a_p_w_mrgn_pct: 1,
          a_p_mrgn: 1,
          a_vrfd: 1,
          a_p_mrgn_pct: 1,
          drops30: 1,
          drops90: 1,
          categories: 1,
          numberOfItems: 1,
          availabilityAmazon: 1,
          categoryTree: 1,
          salesRanks: 1,
          monthlySold: 1,
          ahstprcs: 1,
          anhstprcs: 1,
          auhstprcs: 1,
          curr_ahsprcs: 1,
          curr_ansprcs: 1,
          curr_ausprcs: 1,
          curr_salesRank: 1,
          avg30_ahsprcs: 1,
          avg30_ansprcs: 1,
          avg30_ausprcs: 1,
          avg30_salesRank: 1,
          avg90_ahsprcs: 1,
          avg90_ansprcs: 1,
          avg90_ausprcs: 1,
          avg90_salesRank: 1,
          buyBoxIsAmazon: 1,
          stockAmount: 1,
          stockBuyBox: 1,
          totalOfferCount: 1,
          a_avg_prc: 1,
          curr_prc: 1,
          keepaUpdatedAt: 1,
        },
      },
      {
        $sort: { keepaUpdatedAt: -1, "bsr.number": 1, a_mrgn_pct: -1 },
      },
      { $skip: 0 },
      { $limit: KEEPA_PRODUCT_LIMIT },
    ])
    .toArray()) as unknown as DbProductRecord[];

  if (newProducts.length >= MIN_FLIPS_PRODUCTS) {
    return newProducts.map((product) => {
      return {
        ...product,
        taskType: KeepaTaskType.KEEPA_FLIPS,
      };
    });
  }

  return [];
}

export async function keepaNegMarginProcess({
  activeShops,
}: {
  activeShops: WithId<Shop>[];
}) {
  const keepaProgressPerShop = await getKeepaEanProgressPerShop(activeShops);
  const recoveryShops = await keepaEanTaskRecovery(activeShops!);
  const pleaseRecover = recoveryShops.some((p) => p.pending > 0);

  pleaseRecover &&
    logGlobal(loggerName, `Recover keepa ean task: ${pleaseRecover}`);

  const pendingProducts = pleaseRecover
    ? recoveryShops.reduce((acc, shop) => {
        return acc + shop.pending;
      }, 0)
    : keepaProgressPerShop.reduce((acc, shop) => {
        return acc + shop.pending;
      }, 0);

  const products = await prepareProducts(
    pleaseRecover ? recoveryShops : keepaProgressPerShop,
    true,
    pleaseRecover
  );
  if (products.length) {
    return products.flatMap((ps) => ps);
  }
  return [];
}
async function prepareProducts(
  keepaProgressPerShop: PendingShop[],
  fallback: boolean,
  recovery: boolean
): Promise<ProductWithTask[][]> {
  const pendingShops = keepaProgressPerShop.filter((shop) => shop.pending > 0);
  const pendingProducts = pendingShops.reduce((acc, shop) => {
    return acc + shop.pending;
  }, 0);

  if (pendingProducts < 5) {
    return [];
  }
  await updateTaskWithQuery(
    { type: fallback ? KeepaTaskType.KEEPA_EAN : KeepaTaskType.KEEPA_NORMAL },
    { progress: pendingShops }
  );

  const numberOfPendingShops = pendingShops.length;
  const totalProducts = KEEPA_PRODUCT_LIMIT;
  const productsPerShop = Math.floor(totalProducts / numberOfPendingShops);

  const unqiueDocuments = new Set<string>();
  const prepareProducts = await Promise.all(
    pendingShops.map(async (shop) => {
      const products = await lockProductsForKeepa(
        shop.d,
        productsPerShop,
        fallback,
        recovery
      );

      return products
        .filter((product) => {
          const relevantFilter = fallback ? product.eanList[0] : product.asin!;
          if (unqiueDocuments.has(relevantFilter)) {
            return false;
          } else {
            unqiueDocuments.add(relevantFilter);
            return true;
          }
        })
        .map((product) => {
          return {
            ...product,
            taskType: fallback
              ? KeepaTaskType.KEEPA_EAN
              : KeepaTaskType.KEEPA_NORMAL,
          };
        }) as ProductWithTask[];
    })
  );

  return prepareProducts;
}
