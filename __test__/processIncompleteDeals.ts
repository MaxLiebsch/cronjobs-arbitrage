import { processIncompleteDeals } from "../src/services/processIncompleteDeals.js";

async function processIncompleteDealsTest() {
  await processIncompleteDeals();
}

processIncompleteDealsTest().then(() => {
  console.log("Test finished");
});
