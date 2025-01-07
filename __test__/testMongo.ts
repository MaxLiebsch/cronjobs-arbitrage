
import { getProductsCol } from "../src/db/mongo.js";
import { findProductsForIncompleteDeals } from "../src/util/findProductsForIncompleteDealsService.js";


export const main = async () => {
  const col = await getProductsCol() 
  const products = await col.distinct("tRexId")
  console.log('products:', products)
  
};

main().then((r) => {
  console.log("done");
  process.exit(0);
});
