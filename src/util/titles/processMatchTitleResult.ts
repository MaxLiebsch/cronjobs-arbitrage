import {
  DbProductRecord,
  ObjectId,
  resetAznProductQuery,
  resetEbyProductQuery,
  safeJSONParse,
} from "@dipmaxtech/clr-pkg";
import { BulkWrite } from "../../types/BulkTypes.js";
import { cleanScore } from "../cleanScore.js";
import { MINIMAL_SCORE } from "../../constants.js";
import { extractId } from "../extractId.js";

export function processMatchTitleResult(
  set: Partial<DbProductRecord>,
  result: any,
  products: DbProductRecord[],
  bulkSpotterUpdates: BulkWrite[]
) {
  let deleteAzn = false;
  let deleteEby = false;
  const productId = extractId(result.custom_id);

  const product = products.find(
    (product) => product._id.toString() === productId
  );

  if (!product) {
    return "Product not found in spotterDb";
  }

  const { a_vrfd, e_vrfd } = product;

  const content = result.response.body?.choices[0].message.content;

  if (!content) return "No content found";

  const update = safeJSONParse(content) as {
    a_score: string | number;
    a_isMatch: boolean;
    e_score: string | number;
    e_isMatch: boolean;
  };

  if (!update) return "No update found";

  let nm_prop = "complete";

  if ("a_score" in update && "a_isMatch" in update) {
    const aScore = cleanScore(update.a_score);
    if (aScore < MINIMAL_SCORE) {
      deleteAzn = true;
    } else if (!isNaN(aScore)) {
      set["a_vrfd"] = {
        ...a_vrfd,
        nm_prop,
        score: aScore,
        isMatch: update.a_isMatch,
      };
    }
  }

  if ("e_score" in update && "e_isMatch" in update) {
    const eScore = cleanScore(update.e_score);
    if (eScore < MINIMAL_SCORE) {
      deleteEby = true;
    } else if (!isNaN(eScore)) {
      set["e_vrfd"] = {
        ...e_vrfd,
        nm_prop,
        score: eScore,
        isMatch: update.e_isMatch,
      };
    }
  }

  if (!productId || !ObjectId.isValid(productId)) {
    return "Invalid product id";
  }

  let bulkUpdate: BulkWrite = {
    updateOne: {
      filter: { _id: new ObjectId(productId) },
      update: {
        $unset: { nm_batchId: "", nm_prop: "" },
      },
    },
  };

  if (Object.keys(set).length > 0) {
    bulkUpdate.updateOne.update["$set"] = {
      ...set,
      nm_updatedAt: new Date().toISOString(),
    };
  }

  if (deleteAzn) {
    const resetAzn = resetAznProductQuery();
    bulkUpdate.updateOne.update["$unset"] = {
      ...bulkUpdate.updateOne.update.$unset,
      ...resetAzn.$unset,
    };
  }

  if (deleteEby) {
    const resetEby = resetEbyProductQuery();
    bulkUpdate.updateOne.update["$unset"] = {
      ...bulkUpdate.updateOne.update.$unset,
      ...resetEby.$unset,
    };
  }

  bulkSpotterUpdates.push(bulkUpdate);
  return "processed";
}
