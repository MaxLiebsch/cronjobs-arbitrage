
import { findProductsForIncompleteDeals } from "../src/util/findProductsForIncompleteDealsService.js";


export const main = async () => {
  const pros = await findProductsForIncompleteDeals(20);

};

main().then((r) => {
  console.log("done");
  process.exit(0);
});
