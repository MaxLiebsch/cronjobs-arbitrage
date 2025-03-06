import { scheduleJob } from "node-schedule";
import { TaskRepository } from "./TaskRepository.js";
import { TaskContext } from "./Taskcontext.js";

export class AiTaskTotal {
  private total = 0;
  private totalBatches = 0;
  private yesterdaysTotal = 0;
  private yesterdaysTotalBatches = 0;
  private taskRepository = new TaskRepository();
  constructor(readonly taskContext: TaskContext) {}
  async init() {
    const { total, yesterdaysTotal, totalBatches, yesterdaysTotalBatches } =
      await this.getTotalFromDb();
    if (total) {
      this.total = total;
    }
    if (yesterdaysTotal) {
      this.yesterdaysTotal = yesterdaysTotal;
    }
    if (totalBatches) {
      this.totalBatches = totalBatches;
    }
    if (yesterdaysTotalBatches) {
      this.yesterdaysTotalBatches = yesterdaysTotalBatches;
    }
    scheduleJob("0 0 * * *", async () => {
      await this.taskRepository.update(this.taskContext, {
        yesterdaysTotal: this.total,
        yesterdaysTotalBatches: this.totalBatches,
        total: 0,
        totalBatches: 0,
      });
      this.total = 0;
      this.totalBatches = 0;
    });
  }
  async getTotalFromDb() {
    const taskContext = await this.taskRepository.findById(this.taskContext);
    return {
      total: taskContext.total,
      totalBatches: taskContext.totalBatches,
      yesterdaysTotal: taskContext.yesterdaysTotal,
      yesterdaysTotalBatches: taskContext.yesterdaysTotalBatches,
    };
  }
  async addToTotal(total: number) {
    this.total += total;
    this.totalBatches += 1;
    await this.taskRepository.update(this.taskContext, {
      total: this.total,
      totalBatches: this.totalBatches,
    });
  }
}
