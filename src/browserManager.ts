import puppeteer, { Browser } from "puppeteer";
import Constants from "./config/constants";

class BrowserManager {
  private _awaitReady: Promise<void>;
  private _browser?: Browser;

  constructor() {
    this._awaitReady = this.InitializeBrowser();
  }

  get awaitReady(): Promise<void> {
    return this._awaitReady;
  }

  get browser(): Browser {
    if (!this._browser) {
      throw new Error("Navegador ainda não inicializado. Aguarde awaitReady antes de usar.");
    }

    return this._browser;
  }

  private async InitializeBrowser() {
    this._browser = await puppeteer.launch({
      headless: Constants.browserHeadless,
      defaultViewport: { width: 1280, height: 720 },
    });
    if (!this._browser) throw new Error("Navegador não inicializado corretamente");
  }

  async FinalizeBrowser() {
    await this.browser.close();
  }
}

export default BrowserManager;
