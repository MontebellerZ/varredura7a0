export type TeamData = {
  team: string;
  year: string;
  players: PlayerData[];
};

export type TeamDataTree = {
  [year: string]: {
    [team: string]: TeamData;
  };
};

export type PlayerData = {
  num: string;
  name: string;
  force: string;
  pos: string[];
};

export type ResultGameScraper = {
  teams: TeamData[];
  error: boolean;
};
