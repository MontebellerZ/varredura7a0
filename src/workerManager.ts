import fs from "fs";
import { Browser, Page } from "puppeteer";
import Constants from "./config/constants";

class WorkerManager {
  constructor(private readonly browser: Browser) {}

  private StopSign = false;

  async CreateWorker() {
    const context = await this.browser.createBrowserContext();
    if (!context) throw new Error("Contexto não inicializado corretamente");

    const page = await context.newPage();
    if (!page) throw new Error("Página não inicializada corretamente");

    await page.goto(Constants.siteUrl);

    return page;
  }

  async CreateMultipleWorkers(maxWorkers: number) {
    const workers: Page[] = [];

    for (let i = 0; i < maxWorkers; i++) {
      const worker = await this.CreateWorker();
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

      console.info(`🟣 #${workerId}: Run ${run}`);

      try {
        const result = await executor(worker);
        results.push(result);

        console.info(`🟢 #${workerId}: Run ${run}`);
      } catch (err) {
        console.info(`🔴 #${workerId}: Run ${run}`);

        fs.appendFileSync(Constants.errorFile, `${new Date().toLocaleString()}:\n${err}\n\n\n`);
      }

      try {
        await this.ResetWorker(worker);
      } catch (err) {
        console.info(`🟡 #${workerId}: Ended with error (runs: ${executedRuns})`);

        fs.appendFileSync(Constants.errorFile, `${new Date().toLocaleString()}:\n${err}\n\n\n`);

        return;
      }
    }

    if (this.StopSign) {
      console.info(`🟠 #${workerId}: Stopped (runs: ${executedRuns})`);
      return;
    }

    console.info(`🔵 #${workerId}: Ended (runs: ${executedRuns})`);
  }

  private SetupWorkerStopper() {
    const onEnter = () => {
      console.info(`🟠 Stopping workers`);
      this.StopSign = true;
    };

    const clearStopper = () => {
      process.stdin.off("data", onEnter);
      process.stdin.pause();
      this.StopSign = false;
    };

    process.stdin.once("data", onEnter);
    console.info("⚪ Press [ENTER] to stop workers");

    return clearStopper;
  }

  async ExecuteWorkers<T>(
    workers: Page[],
    executions: number,
    executor: (w: Page) => Promise<T> | T,
  ) {
    const pendingRuns = Array.from({ length: executions }, (_, i) => i + 1);

    const workersResult: T[] = [];

    const clearStopper = this.SetupWorkerStopper();

    await Promise.all(
      workers.map((w, id) => this.RunWorker(w, id + 1, executor, pendingRuns, workersResult)),
    );

    clearStopper();

    return workersResult;
  }
}

export default WorkerManager;
