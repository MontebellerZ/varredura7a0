import BrowserManager from "./browserManager";
import Constants from "./config/constants";
import WorkerManager from "./workerManager";
import GameScraper from "./gameScraper";
import TeamDataManager from "./teamDataManager";
import Logger from "./logger/logger";

async function main() {
  const logger = new Logger();
  await logger.awaitReady;

  await logger.Info("⚪ Started");

  const browserManager = new BrowserManager();
  await browserManager.awaitReady;

  await logger.Info("🔵 Browser ready");

  const workerManager = new WorkerManager(browserManager.browser, logger);
  const workers = await workerManager.CreateMultipleWorkers(Constants.maxWorkers);

  await logger.Info(`🔵 All ${workers.length} workers ready`);

  const workersResult = await workerManager.ExecuteWorkers(
    workers,
    Constants.maxRuns,
    GameScraper.RunGameScraper,
  );

  await logger.Info("🔵 Runs ended");

  const newTeams = workersResult.flatMap((r) => r.teams);

  await logger.Info("🟣 Saving results");

  TeamDataManager.registerNewTeams(newTeams);

  await logger.Info("🟢 Results saved");

  await browserManager.FinalizeBrowser();

  await logger.Info("🔵 Browser ended");

  await logger.Info("🟢 Ended");

  await logger.Close();
}

main()
  .then(() => console.info("\n\nFinalizado com sucesso"))
  .catch((err) => console.error(err, "\n\nFinalizado com erro"));
