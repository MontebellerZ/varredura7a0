import { ElementHandle, Page } from "puppeteer";
import { PlayerData, TeamData } from "./config/types";
import { errorRegister } from "./config/utils";

class GameScraper {
  private _page: Page;

  constructor(page: Page) {
    this._page = page;
  }

  get page(): Page {
    return this._page;
  }

  async GetTeamData(): Promise<TeamData> {
    const team = await this.page.$eval(".roll-result > div.rr-sel", (sel) =>
      [...sel.childNodes].at(-1)?.textContent?.trim(),
    );

    const year = await this.page.$eval(
      ".roll-result > .rr-copa",
      (copa) => copa.textContent.match(/\d{4}/)?.[0],
    );

    if (!team || !year) throw new Error("Seleção não identificada corretamente");

    const playersRows = await this.page.$$("button.pool-row");

    const players: PlayerData[] = [];

    for (const row of playersRows) {
      const num = await row.$eval(".pool-num", (p) => p.textContent.replace(/\D/g, ""));
      const name = await row.$eval(".pool-name", (p) => p.textContent.trim());
      const force = await row.$eval(".pool-force", (p) => p.textContent.trim());
      const { pos, missingPos } = await this.FindPlayerPos(row);

      players.push({ num, name, force, pos, missingPos });
    }

    if (!players.length) throw new Error("Jogadores não identificados corretamente");

    return { team, year, players };
  }

  async ChangeTeam() {
    await this.page.click(".reroll-btn:first-child");

    await this.page.waitForSelector(".pool-row");
  }

  async Roll() {
    await this.page.click(".roll-btn");

    await this.page.waitForSelector(".pool-row");
  }

  async PickPlayer() {
    const availablePlayers = await this.page.$$("button.pool-row:not(.not-selectable)");
    if (!availablePlayers.length) throw new Error("Nenhum player disponível encontrado");

    const player = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];

    for (let attempt = 0; attempt < 2; attempt++) {
      await player.click();

      const slot = await this.page
        .waitForSelector(".slot-pickable", { timeout: 500 })
        .catch(() => null);

      if (slot) {
        await slot.click();
        return;
      }
    }

    throw new Error("Clique não abriu nenhum slot");
  }

  async FindPlayerPos(playerRow: ElementHandle<HTMLButtonElement>) {
    const posHandle = await playerRow.$(".pool-pos");
    if (!posHandle) throw new Error("Posição do jogador não encontrada");

    const selectable = await playerRow.evaluate((row) => !row.classList.contains("not-selectable"));

    const pos = await posHandle.evaluate(
      (posElement) => posElement.childNodes[0]?.textContent?.trim().split("/") ?? [],
    );

    let missingPos = await posHandle
      .$(".pool-pos-more")
      .then((handle) => handle?.evaluate((more) => Number(more.textContent.trim())) ?? 0);

    if (missingPos && selectable) {
      await playerRow.click();

      await this.page.waitForSelector(".slot-pickable");

      const slotsPos = await this.page.$$eval(".slot-pickable", (slots) =>
        slots.map((slot) => slot.textContent.trim()),
      );

      const posDiff = slotsPos.filter((sp) => !pos.includes(sp));

      if (posDiff.length > 0) {
        missingPos -= posDiff.length;
        pos.push(...posDiff);
      }
    }

    return { pos, missingPos };
  }

  async FullScrap() {
    const allTeams: TeamData[] = [];

    try {
      await this.Roll();
      allTeams.push(await this.GetTeamData());

      for (let i = 0; i < 3; i++) {
        await this.ChangeTeam();

        allTeams.push(await this.GetTeamData());
      }

      for (let i = 0; i < 10; i++) {
        await this.PickPlayer();

        await this.Roll();

        allTeams.push(await this.GetTeamData());
      }
    } catch (err) {
      errorRegister(err);

      return { teams: allTeams, error: true };
    }

    return { teams: allTeams, error: false };
  }

  static async RunGameScraper(page: Page) {
    const game = new GameScraper(page);

    const result = await game.FullScrap();

    return result;
  }
}

export default GameScraper;
