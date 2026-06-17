import BrowserManager from "./browserManager";
import { Browser, Page } from "puppeteer";
import path from "path";
import url from "url";

class HtmlManager {
  private _awaitReady: Promise<void>;

  private browserManager = new BrowserManager(false);
  private browser?: Browser;
  private page?: Page;

  constructor(private readonly filepath: string) {
    this._awaitReady = this.browserManager.awaitReady.then(() => this.Initialize());
  }

  get awaitReady(): Promise<void> {
    return this._awaitReady;
  }

  private async Initialize() {
    this.browser = this.browserManager.browser;
    this.page = await this.browser.pages().then((p) => p[0]);

    const htmlFileUrl = url.pathToFileURL(path.resolve(this.filepath)).toString();
    await this.page.goto(htmlFileUrl);
  }

  async NewEvent(eventLabel: string, eventData: any) {
    if (!this.page) throw new Error("Página não inicializada corretamente");

    await this.page.evaluate(
      (eventLabel, eventData) => {
        window.dispatchEvent(new CustomEvent(eventLabel, { detail: eventData }));
      },
      eventLabel,
      eventData,
    );
  }

  async Finalize() {
    this.browserManager.FinalizeBrowser();
  }
}

export default HtmlManager;
