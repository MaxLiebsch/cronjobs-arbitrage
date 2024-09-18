import { ObjectId } from "@dipmaxtech/clr-pkg";

export interface BulkWrite {
  updateOne: {
    filter: { _id: ObjectId };
    update: {
      $unset: { [key: string]: string };
      $set?: { [key: string]: any };
    };
  };
}
