import { getKeepaEanProgressPerShop } from "../src/db/util/getFallbackKeepaProgress.js";
import { getKeepaProgress, getKeepaProgressPerShop } from "../src/db/util/getKeepaProgress.js";
import { keepaTaskRecovery } from "../src/db/util/getKeepaRecovery.js";
import { getActiveShops } from "../src/db/util/shops.js";

async function main() {
  const activeShops = await getActiveShops();

  const progress = await getKeepaEanProgressPerShop(activeShops);
  console.log('progress:', progress)

}
main()
  .then(() => {})
  .catch((err) => console.error(err));
// Compare this snippet from __test__/getProgress.js:
