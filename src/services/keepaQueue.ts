import "dotenv/config";
import { config } from "dotenv";
import { Job, scheduleJob } from "node-schedule";
import { updateTaskWithQuery } from "../db/util/updateTask.js";
import { LocalLogger, Shop, sleep, WithId } from "@dipmaxtech/clr-pkg";
import { CJ_LOGGER, logGlobal, setTaskLogger } from "../util/logger.js";
import { IKeepaTaskType, ProductWithTask } from "../types/products.js";
import { makeRequestsForAsin } from "../util/makeRequestForAsin.js";
import { makeRequestsForEan } from "../util/makeRequestForEan.js";
import { makeRequestsForWholesaleEan } from "../util/makeRequestForWholesaleEan.js";
import { makeRequestsForSales } from "../util/makeRequestForSales.js";
import PQueue from "p-queue";
import { KeepaResponse } from "../types/KeepaResponse.js";
import { keepaNewProcess, keepaWholesaleProcess } from "../util/lookForPendingKeepaLookups.js";
import { keepaNegMarginProcess } from "../util/lookForPendingKeepaLookups.js";
import { keepaNormalProcess } from "../util/lookForPendingKeepaLookups.js";
import { getActiveShops } from "../db/util/shops.js";
import { keepaSalesProcess } from "../util/lookForPendingKeepaLookups.js";
import { getCrawlDataDb } from "../db/mongo.js";
import { KEEPA_INTERVAL } from "../constants.js";
import { debugLog } from "../util/debugLog.js";
import { KeepaRatelimit } from "../model/keepaRatelimit.js";

config({
  path: [`.env`],
});

export type KeepaQueueResponse = {
  success: boolean;
  data?: KeepaResponse;
} & (
  | { success: true; product?: never }
  | { success: false; product: ProductWithTask }
);

export class KeepaQueue {
  private queue: PQueue;
  private keepaRatelimit: KeepaRatelimit = new KeepaRatelimit();
  private loggerName: keyof typeof CJ_LOGGER = CJ_LOGGER.PENDING_KEEPAS;
  private logger: any = new LocalLogger().createLogger(this.loggerName);
  private job: Job | null = null;
  private _total: number = 0;
  private stats: {
    [key in IKeepaTaskType]: number;
  } = {
    KEEPA_SALES: 0,
    KEEPA_NORMAL: 0,
    KEEPA_WHOLESALE: 0,
    KEEPA_NEW: 0,
    KEEPA_EAN: 0,
  };
  private readonly taskTypeToHandler = {
    KEEPA_SALES: makeRequestsForSales,
    KEEPA_NORMAL: makeRequestsForAsin,
    KEEPA_WHOLESALE: makeRequestsForWholesaleEan,
    KEEPA_NEW: makeRequestsForEan,
    KEEPA_EAN: makeRequestsForEan,
  } as const;

  constructor() {
    this.queue = new PQueue({ concurrency: 1 });
    this.setupQueueListeners();
    setTaskLogger(this.logger, this.loggerName);
  }
  private setupQueueListeners(): void {
    this.queue.on("completed", async (args: KeepaQueueResponse) => {
      debugLog("Completed", args, "pause");
      this.queue.pause();
      const { success, data, product } = args;
      if (data) {
        this.keepaRatelimit.setCurrentLimits(data);
        debugLog("Setting current limits", {
          tokensLeft: data.tokensLeft,
          refillIn: data.refillIn,
        });
      }

      if (!success && product) {
        debugLog("Decrementing total");
        this.decrementTotal();
        this.decrementStats(product.taskType);
        debugLog("Adding product to queue since it failed");
        this.addToQueue([product]);
      }

      if (this.keepaRatelimit.tokensLeft <= 0) {
      logGlobal(
        this.loggerName,
          `Tokens left is ${this.keepaRatelimit.tokensLeft}, waiting ${this.keepaRatelimit.refillIn} ms`
        );
        await sleep(this.keepaRatelimit.refillIn);
      }

      debugLog(`Tokens left: ${this.keepaRatelimit.tokensLeft}`);
      if (this.isIdle()) {
        debugLog("Queue is idle, checking for pending products");
        await this.checkAndProcessPendingProducts();
      } else {
        this.queue.start();
      }
    });

    this.queue.on("idle", async () => { 
      if (this.job) {
        this.job.cancel();
        this.job = null;
      }
      logGlobal(
        this.loggerName,
        "Batch is done. Looking for pending keepa lookups..."
      );
      if (this.keepaRatelimit.tokensLeft <= 0)
        await sleep(this.keepaRatelimit.refillIn);

      await this.checkAndProcessPendingProducts();
    });
  }
  public async start() {
    await this.setTotalFromDb();
    scheduleJob("0 0 * * *", async () => {
      await updateTaskWithQuery(
        { type: "KEEPA_NORMAL" },
        {
          total: 0,
          yesterday: this.total,
          statsYesterday: this.stats,
          stats: {
            KEEPA_NORMAL: 0,
            KEEPA_EAN: 0,
            KEEPA_WHOLESALE: 0,
            KEEPA_SALES: 0,
          },
        }
      );
      this.total = 0;
      this.stats = {
        KEEPA_NORMAL: 0,
        KEEPA_WHOLESALE: 0,
        KEEPA_SALES: 0,
        KEEPA_NEW: 0,
        KEEPA_EAN: 0,
      };
    });
    scheduleJob("*/2 * * * *", async () => {
      await updateTaskWithQuery(
        { type: "KEEPA_NORMAL" },
        { total: this.total, stats: this.stats }
      );
    });
    await this.checkAndProcessPendingProducts();
  }
  private async setTotalFromDb() {
    const db = await getCrawlDataDb();
    const keepaTask = await db
      .collection("tasks")
      .findOne({ type: "KEEPA_NORMAL" });
    if (keepaTask?.total) {
      this.total = keepaTask.total;
    }
    if (keepaTask?.stats) {
      this.stats = keepaTask.stats;
    }
  }
  private async checkAndProcessPendingProducts() {
    const productsWithTask = await this.lookForPendingKeepaLookups();
    if (productsWithTask.length) {
      if (this.job) {
        this.job.cancel();
        this.job = null;
      }
      logGlobal(
        this.loggerName,
        `${productsWithTask[0].taskType}: Adding products to queue: ${productsWithTask.length}`
      );
      this.addToQueue(productsWithTask);

      if (this.queue.isPaused) {
        this.queue.start();
      }
    } else {
      if (this.job === null) {
        logGlobal(this.loggerName, "Queue is empty, starting job");
        this.job = scheduleJob(
          KEEPA_INTERVAL,
          async () => await this.checkAndProcessPendingProducts()
        );
      }
    }
  }
  private async lookForPendingKeepaLookups() {
    const activeShops = await getActiveShops();
    if (!activeShops) return [];

    activeShops.push({ d: "sales" } as WithId<Shop>);

    const processes = [
      { fn: keepaSalesProcess, args: undefined },
      { fn: keepaNormalProcess, args: { activeShops } },
      { fn: keepaWholesaleProcess, args: undefined },
      { fn: keepaNewProcess, args: undefined },
      { fn: keepaNegMarginProcess, args: { activeShops } },
    ] as const;

    for (const process of processes) {
      const result = await process.fn(process.args!);
      if (result.length) return result;
    }

    return [];
  }
  private addToQueue(productsWithTask: ProductWithTask[]) {
    for (const product of productsWithTask) {
      this.queue.add(async () => {
        this.incrementTotal();
        this.incrementStats(product.taskType);
        const handler = this.taskTypeToHandler[product.taskType];
        return handler ? await handler(product) : undefined;

      });
    }
  }
  private set total(value: number) {
    this._total = value;
  }
  private get total(): number {
    return this._total;
  }

  private incrementStats = (type: IKeepaTaskType) => {
    this.stats[type]++;
  };

  private decrementStats = (type: IKeepaTaskType) => {
    this.stats[type]--;
  };

  private incrementTotal = () => {
    this._total++;
  };
  private decrementTotal = () => {
    this._total--;
  };

  public isIdle = () => {
    return this.queue.size === 0 && this.queue.pending === 0;
  };
}
