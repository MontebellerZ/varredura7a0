import fs from "fs";
import Constants from "./config/constants";
import { TeamData, TeamDataTree } from "./config/types";

class TeamDataManager {
  static readTeamsFile() {
    const teamsFile = fs.readFileSync(Constants.teamsFile, { encoding: "utf8" });
    const teams = JSON.parse(teamsFile) as TeamData[];
    return teams;
  }

  static saveTeamsFile(teams: TeamData[]) {
    fs.writeFileSync(Constants.teamsFile, JSON.stringify(teams, null, 2));
  }

  static mergeTeamsData(...allTeamArrays: TeamData[][]) {
    const mergedTeams: TeamDataTree = {};

    for (const teamData of allTeamArrays.flat()) {
      const { team, year, players } = teamData;

      const yearGroup = (mergedTeams[year] ??= {});
      const existingTeam = yearGroup[team];

      if (!existingTeam) {
        yearGroup[team] = teamData;
        continue;
      }

      for (const player of players) {
        const existingPlayer = existingTeam.players.find((p) => p.name === player.name);

        if (!existingPlayer) {
          existingTeam.players.push(player);
          continue;
        }

        const oldTotalPos = existingPlayer.pos.length + existingPlayer.missingPos;
        const newTotalPos = player.pos.length + player.missingPos;

        const mergedPos = [...new Set([...existingPlayer.pos, ...player.pos])].sort();

        existingPlayer.pos = mergedPos;
        existingPlayer.missingPos = Math.max(oldTotalPos, newTotalPos) - mergedPos.length;
      }
    }

    const flatTeams = Object.values(mergedTeams).flatMap((yearGroup) => Object.values(yearGroup));

    return flatTeams;
  }

  static registerNewTeams(newTeams: TeamData[]) {
    const oldTeams = this.readTeamsFile();

    const mergedTeamData = this.mergeTeamsData(oldTeams, newTeams);

    this.saveTeamsFile(mergedTeamData);
  }
}

export default TeamDataManager;
