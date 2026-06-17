import fs from "fs";
import { Browser, Page } from "puppeteer";
import Constants from "./config/constants";
import Logger from "./logger/logger";

class WorkerManager {
  constructor(
    private readonly browser: Browser,
    private readonly logger: Logger,
  ) {}

  private StopSign = false;

  async CreateWorker(workerId?: number) {
    const context = await this.browser.createBrowserContext();
    if (!context) throw new Error("Contexto não inicializado corretamente");

    const page = await context.newPage();
    if (!page) throw new Error("Página não inicializada corretamente");

    await page.goto(Constants.siteUrl);

    await this.logger.Info(workerId ? `🔵 #${workerId}: Worker ready` : `🔵 Worker ready`);

    return page;
  }

  async CreateMultipleWorkers(maxWorkers: number) {
    const workers: Page[] = [];

    for (let i = 0; i < maxWorkers; i++) {
      const worker = await this.CreateWorker(i + 1);
      workers.push(worker);
    }

    return workers;
  }

  private async ResetWorker(worker: Page) {
    await worker.goto(Constants.siteUrl);
  }

  private async RunWorker<T>(
    worker: Page,
    workerId: number,
    executor: (w: Page) => Promise<T> | T,
    pendingRuns: number[],
    results: T[],
  ) {
    let executedRuns = 0;

    while (pendingRuns.length && !this.StopSign) {
      const run = pendingRuns.shift();
      executedRuns++;

      const logId = await this.logger.Info(`🟣 #${workerId}: Run ${run}`);

      try {
        const result = await executor(worker);
        results.push(result);

        await this.logger.UpdateInfo(logId, `🟢 #${workerId}: Run ${run}`);
      } catch (err) {
        await this.logger.UpdateError(logId, `🔴 #${workerId}: Run ${run}`);

        fs.appendFileSync(Constants.errorFile, `${new Date().toLocaleString()}:\n${err}\n\n\n`);
      }

      try {
        await this.ResetWorker(worker);
      } catch (err) {
        await this.logger.Warn(`🟡 #${workerId}: Ended with error (runs: ${executedRuns})`);

        fs.appendFileSync(Constants.errorFile, `${new Date().toLocaleString()}:\n${err}\n\n\n`);

        return;
      }
    }

    if (this.StopSign) {
      await this.logger.Warn(`🟠 #${workerId}: Stopped (runs: ${executedRuns})`);
      return;
    }

    await this.logger.Info(`🔵 #${workerId}: Ended (runs: ${executedRuns})`);
  }

  private async SetupWorkerStopper() {
    const onEnter = async () => {
      await this.logger.Warn("🟠 Stopping workers");
      this.StopSign = true;
    };

    const clearStopper = () => {
      process.stdin.off("data", onEnter);
      process.stdin.pause();
      this.StopSign = false;
    };

    process.stdin.once("data", onEnter);
    await this.logger.Info("⚪ Press [ENTER] in the terminal to stop workers");

    return clearStopper;
  }

  async ExecuteWorkers<T>(
    workers: Page[],
    executions: number,
    executor: (w: Page) => Promise<T> | T,
  ) {
    const pendingRuns = Array.from({ length: executions }, (_, i) => i + 1);

    const workersResult: T[] = [];

    const clearStopper = await this.SetupWorkerStopper();

    await Promise.all(
      workers.map((w, id) => this.RunWorker(w, id + 1, executor, pendingRuns, workersResult)),
    );

    clearStopper();

    return workersResult;
  }
}

export default WorkerManager;
