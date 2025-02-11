import { getProductsCol } from "../src/db/mongo.js";
import { findProductsForIncompleteDeals } from "../src/util/findProductsForIncompleteDealsService.js";

export const main = async () => {
  const col = await getProductsCol();
  const products = await col
    .aggregate([
      {
        $match: { 
          a_pblsh: true,
          a_mrgn: { $gte: 0 },
          $text: { $search: "playmobile" } },
      },
      {
        $project: {
          nm: 1,
           a_nm: 1, e_nm: 1, _id: 0 
        },
      },
      {
        $limit: 10,
      }

    ])
    .explain();
  console.log("products:", JSON.stringify(products,null,2))
};

main().then((r) => {
  console.log("done");
  process.exit(0);
});
