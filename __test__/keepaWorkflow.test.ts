import { existsAsync, readAsync, removeAsync } from "fs-jetpack";
import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";
import { getProductsCol } from "../src/db/mongo.js";
import { KeepaQueue } from "../src/services/keepaQueue.js";

let idleCnt = 0;
const MAX_IDLE_CNT = 3;
const MAX_WAIT_TIME = 15 * 60 * 1000; // 15 minutes

describe("Keepa Workflow", () => {
  beforeAll(async () => {
    const dir = await existsAsync('./var/log/tasks/task-PENDING_KEEPAS.log')
    if(dir !== 'file'){
        throw new Error('log File not found')
    }else{
        await removeAsync('./var/log/tasks/task-PENDING_KEEPAS.log')
    }

    const productCol = await getProductsCol();
    await productCol.deleteMany({});
    const products: DbProductRecord[] = [];
    const normalFile = await readAsync("./__test__/testdata/keepa/normal.json");
    if (!normalFile) {
      throw new Error("File not found");
    }
    const data = JSON.parse(normalFile) as any[];
    data.slice(0, 20).forEach((item) => {
      item._id = new ObjectId(item._id.$oid);
      delete item["keepaUpdatedAt"] 
      delete item["keepa_lckd"]
      products.push(item);
    });
    const eanFile = await readAsync("./__test__/testdata/keepa/ean.json");
    if (!eanFile) {
      throw new Error("File not found");
    }
    const eanData = JSON.parse(eanFile) as any[];
    eanData.slice(0, 20).forEach((item) => {
      item._id = new ObjectId(item._id.$oid);
      item["keepaEanUpdatedAt"] = new Date(
        Date.now() - 1000 * 60 * 60 * 24 * 16
      ).toISOString();
      delete item["keepaEan_lckd"];
      item['info_prop'] = 'missing'
      products.push(item);
    });

    const salesFile = await readAsync("./__test__/testdata/keepa/sales.json");
    if (!salesFile) {
      throw new Error("File not found");
    }
    const salesData = JSON.parse(salesFile) as any[];
    salesData.slice(0, 20).forEach((item) => {
      item._id = new ObjectId(item._id.$oid);
      delete item.keepaUpdatedAt;
      // set created To today midnight
      item.createdAt = new Date().toISOString();
      products.push(item);
    });

    const wholesaleFile = await readAsync(
      "./__test__/testdata/keepa/wholesale.json"
    );
    if (!wholesaleFile) {
      throw new Error("File not found");
    }
    const wholesaleData = JSON.parse(wholesaleFile) as any[];
    wholesaleData.slice(0, 20).forEach((item) => {
      item._id = new ObjectId(item._id.$oid);
      item.a_lookup_pending = true;
      item.a_status = "keepa";
      item.target = "a";
      products.push(item);
    });

    await productCol.insertMany(products);
  });
  it("should start the workflow", async () => {
    const keepaQueue = new KeepaQueue();
    await keepaQueue.start();

    // Wait for queue to be idle with timeout
    const startTime = Date.now();

    while (Date.now() - startTime < MAX_WAIT_TIME) {
      const isIdle = keepaQueue.isIdle();
      console.log('isIdle:', isIdle)
      if (isIdle) {
        idleCnt++;
        if (idleCnt === MAX_IDLE_CNT) {
          break;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 1 second before checking again
    }
  }, MAX_WAIT_TIME);
});
