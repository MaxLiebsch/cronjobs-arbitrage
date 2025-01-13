import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";
import {
  findTaskWithQuery,
  updateTaskWithQuery,
} from "../db/util/updateTask.js";

export const updateWholesaleProgress = async (
  product: DbProductRecord
) => {
  
  if (product.taskIds && product.taskIds.length > 0) {
    let task = null;
    for (const taskId of product.taskIds) {
      task = await findTaskWithQuery({
        _id: new ObjectId(taskId),
        id: "wholesale_search",
      });
      if (task) break;
    }
    if (task) {
      const progress = task.progress;
      await updateTaskWithQuery(
        { _id: task._id },
        {
          progress: {
            ...progress,
            pending: progress.pending - 1,
            completed: progress.completed + 1,
          },
        }
      );
    }
  }
};
