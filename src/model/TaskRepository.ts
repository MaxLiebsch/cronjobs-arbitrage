import { getCrawlDataDb } from "../db/mongo.js";
import { TaskContext } from "./Taskcontext.js";
export class TaskRepository {
  async findAll() {
    const crawlDataDb = await getCrawlDataDb();
    const tasksCol = crawlDataDb.collection("tasks");
    const aiTasks = (await tasksCol
      .find({ type: "AI_TASKS_NEW", active: true })
      .toArray()) as unknown as TaskContext[];
    return aiTasks;
  }

  async findById(context: TaskContext) {
    const crawlDataDb = await getCrawlDataDb();
    const tasksCol = crawlDataDb.collection("tasks");
    const aiTask = await tasksCol.findOne({ _id: context._id });
    return aiTask as unknown as TaskContext;
  }

  async update(context: TaskContext, update: Partial<TaskContext>) {
    const crawlDataDb = await getCrawlDataDb();
    const tasksCol = crawlDataDb.collection("tasks");
    await tasksCol.updateOne({ _id: context._id }, { $set: update });
  }

}
