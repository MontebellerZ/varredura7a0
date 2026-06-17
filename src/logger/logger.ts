import HtmlManager from "../htmlManager";

class Logger {
  private _awaitReady: Promise<void>;

  private htmlManager = new HtmlManager("./src/logger/logger.html");
  private logs = new Map<number, unknown[]>();
  private total = 0;

  constructor() {
    this._awaitReady = this.htmlManager.awaitReady;
  }

  get awaitReady(): Promise<void> {
    return this._awaitReady;
  }

  private async RegisterEvent(id: number, ...args: unknown[]) {
    this.logs.set(id, args);
    const text = args.join(" ");
    await this.htmlManager.NewEvent("log", { id, text });
  }

  async Log(...args: unknown[]) {
    const id = ++this.total;
    await this.RegisterEvent(id, ...args);
    console.log(...args);
    return id;
  }

  async Info(...args: unknown[]) {
    const id = ++this.total;
    await this.RegisterEvent(id, ...args);
    console.info(...args);
    return id;
  }

  async Error(...args: unknown[]) {
    const id = ++this.total;
    await this.RegisterEvent(id, ...args);
    console.error(...args);
    return id;
  }

  async Warn(...args: unknown[]) {
    const id = ++this.total;
    await this.RegisterEvent(id, ...args);
    console.warn(...args);
    return id;
  }

  async UpdateLog(id: number, ...args: unknown[]) {
    await this.RegisterEvent(id, ...args);
    console.log(...args);
    return id;
  }

  async UpdateInfo(id: number, ...args: unknown[]) {
    await this.RegisterEvent(id, ...args);
    console.info(...args);
    return id;
  }

  async UpdateError(id: number, ...args: unknown[]) {
    await this.RegisterEvent(id, ...args);
    console.error(...args);
    return id;
  }

  async UpdateWarn(id: number, ...args: unknown[]) {
    await this.RegisterEvent(id, ...args);
    console.warn(...args);
    return id;
  }

  async Close() {
    await this.htmlManager.Finalize();
  }
}

export default Logger;
