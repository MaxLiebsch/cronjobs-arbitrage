import {
  deleteArbispotterProducts,
  findArbispotterProducts,
  insertArbispotterProducts,
  updateProduct,
} from "../db/util/crudArbispotterProduct.js";
import { getActiveShops } from "../db/util/shops.js";

const correctMargin = async () => {
  const activeShops = await getActiveShops();

  for (const shop of Object.values(activeShops)) {
    let hasMoreProducts = true;
    const batchSize = 500;
    while (hasMoreProducts) {
      const products = await findArbispotterProducts(
        shop.d,
        {
          $and: [
            { a_mrgn: { $type: ["string"] } },
            { a_prc: { $exists: true } },
            { costs: { $exists: true } },
          ],
        },
        batchSize
      );
      if (products.length) {
        await Promise.all(
          products.map((p) => {
            const margin = calculateAznArbitrage(
              p.prc,
              p.a_prc,
              p.costs,
              p.tax
            );
            return updateProduct(shop.d, p.lnk, { ...margin });
          })
        );
        console.log(
          `Corrected ${products.length} product's iso dates in ${shop.d}`
        );
      } else {
        console.log(`No unwatched products found for shop ${shop.d}`);
      }
      hasMoreProducts = products.length === batchSize;
    }
  }
};

correctMargin().then((r) => {
  process.exit(0);
});

function roundToTwoDecimals(num) {
  return Math.round(num * 100) / 100;
}

const calculateMargeAndEarning = (
  sellPrice,
  buyPrice,
  costs,
  tax,
  period,
  program = "europe"
) => {
  // VK - Kosten - Steuern - EK / VK * 100
  const taxCosts = roundToTwoDecimals(sellPrice - sellPrice / (1 + tax / 100));

  let totalCosts = roundToTwoDecimals(
    costs.azn + costs.varc + costs.tpt + costs[period] + buyPrice + taxCosts
  );

  if (program === "none") {
    totalCosts += 0.25;
  }

  const earning = sellPrice - totalCosts;
  const margin = ((sellPrice - totalCosts) / sellPrice) * 100;
  return {
    earning: roundToTwoDecimals(earning),
    margin: roundToTwoDecimals(margin),
  };
};

export const calculateAznArbitrage = (_buyPrice, sellPrice, costs, tax) => {
  const buyPrice = roundToTwoDecimals(
    _buyPrice / (tax ? 1 + roundToTwoDecimals(tax / 100) : 1.19)
  );
  // VK(sellPrice) - Kosten - Steuern - EK(buyPrice) / VK * 100
  const { margin: a_mrgn_pct, earning: a_mrgn } = calculateMargeAndEarning(
    sellPrice,
    buyPrice,
    costs,
    tax ?? 19,
    "strg_1_hy"
  );
  const { margin: a_w_mrgn_pct, earning: a_w_mrgn } = calculateMargeAndEarning(
    sellPrice,
    buyPrice,
    costs,
    tax ?? 19,
    "strg_2_hy"
  );

  // Not azn europe programm
  const { margin: a_p_mrgn_pct, earning: a_p_mrgn } = calculateMargeAndEarning(
    sellPrice,
    buyPrice,
    costs,
    tax ?? 19,
    "strg_1_hy",
    "none"
  );
  const { margin: a_p_w_mrgn_pct, earning: a_p_w_mrgn } =
    calculateMargeAndEarning(
      sellPrice,
      buyPrice,
      costs,
      tax ?? 19,
      "strg_2_hy",
      "none"
    );

  return {
    a_p_mrgn,
    a_p_mrgn_pct,
    a_p_w_mrgn,
    a_p_w_mrgn_pct,
    a_mrgn,
    a_mrgn_pct,
    a_w_mrgn,
    a_w_mrgn_pct,
  };
};
