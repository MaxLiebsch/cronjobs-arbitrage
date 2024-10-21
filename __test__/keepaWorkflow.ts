import { processQueue } from "../src/services/keepa.js";
import { lookForPendingKeepaLookups } from "../src/util/lookForPendingKeepaLookups.js";


async function testKeepaWorkflow() {
    let keepaJob = null;

    await lookForPendingKeepaLookups(keepaJob);
    await processQueue(keepaJob);
}

testKeepaWorkflow().then(() => {
    console.log("Test finished");
})