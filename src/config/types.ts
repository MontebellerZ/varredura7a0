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
  missingPos: number;
};
