import { ObjectId } from "@dipmaxtech/clr-pkg";
import { path, readAsync } from "fs-jetpack";

export async function readTestFile(fileName: string) {
  const fileContent = await readAsync(
    path(__dirname, `../../__test__/testdata/${fileName}`),
    "json"
  );

  if (!fileContent) throw new Error(`No file content found for ${fileName}`);
  return fileContent.map((task: any) => {
    return {
      ...task,
      _id: new ObjectId(task._id.$oid),
    };
  });
}
