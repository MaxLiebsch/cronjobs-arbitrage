import { AiTaskManager } from "../src/model/AiTaskManager";

async function main() {
  const aiTaskManager = new AiTaskManager();
  aiTaskManager.init().then();
}

main().then(()=>{
  console.log("AiTaskManager initialized");
});

