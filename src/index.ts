import BrowserManager from "./browserManager";
import Constants from "./config/constants";
import WorkerManager from "./workerManager";
import GameScraper from "./gameScraper";
import TeamDataManager from "./teamDataManager";

async function main() {
  console.info("⚪ Started");

  const browserManager = new BrowserManager();
  await browserManager.awaitReady;

  console.info("🔵 Browser ready");

  const workerManager = new WorkerManager(browserManager.browser);
  const workers = await workerManager.CreateMultipleWorkers(Constants.maxWorkers);

  console.info(`🔵 Workers (${workers.length}) ready`);

  const workersResult = await workerManager.ExecuteWorkers(
    workers,
    Constants.maxRuns,
    GameScraper.RunGameScraper,
  );

  console.info("🔵 Runs ended");

  const newTeams = workersResult.flatMap((r) => r.teams);

  console.info("🟣 Saving results");

  TeamDataManager.registerNewTeams(newTeams);

  console.info("🟢 Results saved");

  await browserManager.FinalizeBrowser();

  console.info("🔵 Browser ended");

  console.info("🟢 Ended");
}

main()
  .then(() => console.info("\n\nFinalizado com sucesso"))
  .catch((err) => console.error(err, "\n\nFinalizado com erro"));
