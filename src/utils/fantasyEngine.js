import playerStats from "../data/playerStats";

export function getRankedPlayers() {
  const scoredPlayers = playerStats.map((player) => {
    // Round before assigning tier so score and tier always agree
    const fantasyScore = Math.round(calculateESPNScore(player));

    return {
      ...player,
      fantasyScore,
      tier: assignTier(fantasyScore),
    };
  });

  scoredPlayers.sort((a, b) => b.fantasyScore - a.fantasyScore);

  const rankedPlayers = scoredPlayers.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));

  return rankedPlayers;
}

export function calculateESPNScore(player) {
  const pts  = player.pts  || 0;
  const reb  = player.reb  || 0;
  const ast  = player.ast  || 0;
  const stl  = player.stl  || 0;
  const blk  = player.blk  || 0;
  const fgm  = player.fgm  || 0;
  const fg3m = player.fg3m || 0;
  const fga  = player.fga  || 0;
  const ftm  = player.ftm  || 0;
  const fta  = player.fta  || 0;
  const tov  = player.tov  || 0;

  const missedFG = fga - fgm;
  const missedFT = fta - ftm;

  return (
    pts  * 1   +
    reb  * 1.2 +
    ast  * 1.5 +
    stl  * 3   +
    blk  * 3   +
    fg3m * 1.5 -
    missedFG * 0.5 -
    missedFT * 0.5 -
    tov  * 1
  );
}

export function assignTier(score) {
  if (score >= 50) return "Elite Start";
  if (score >= 40) return "Strong Start";
  if (score >= 30) return "Flex Play";
  return "Bench";
}