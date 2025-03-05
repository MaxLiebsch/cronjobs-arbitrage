import { Queries } from "../src/model/implementations/query";
import { AiTaskTypes } from "../src/types/aiTasks";

describe("MatchTitlesAgg", () => {
  it("should match titles", () => {
     const query = Queries[AiTaskTypes.MATCH_TITLES];
     console.log('match titles', JSON.stringify(query(50)))
  });

  it("should detect quantity", () => {
    const query = Queries[AiTaskTypes.DETECT_QUANTITY];
    console.log('detect quantity', JSON.stringify(query(50)));
  });
});
