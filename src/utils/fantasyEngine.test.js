// tests for fantasyEngine.js — the core of how ClutchStats works
// these three functions drive every ranking, tier badge, and score on the site
// if any of them break silently, the data shown to users is wrong without anyone knowing
// run with: npm test

import { describe, it, expect } from "vitest";
import { calculateESPNScore, assignTier, getRankedPlayers } from "./fantasyEngine";

// core scoring formula — if this breaks, every player's ClutchScore is wrong
describe("calculateESPNScore", () => {
  it("returns 0 for a player with no stats", () => {
    expect(calculateESPNScore({})).toBe(0);
  });

  it("scores points correctly", () => {
    expect(calculateESPNScore({ pts: 10 })).toBe(10);
  });

  it("applies the right multiplier for rebounds", () => {
    expect(calculateESPNScore({ reb: 10 })).toBe(12);
  });

  it("applies the right multiplier for assists", () => {
    expect(calculateESPNScore({ ast: 10 })).toBe(15);
  });

  it("applies the right multiplier for steals and blocks", () => {
    expect(calculateESPNScore({ stl: 2, blk: 1 })).toBe(9);
  });

  it("penalises missed field goals", () => {
    // 5 makes out of 10 attempts = 5 missed FG × -0.5 = -2.5
    expect(calculateESPNScore({ fgm: 5, fga: 10 })).toBe(-2.5);
  });

  it("penalises turnovers", () => {
    expect(calculateESPNScore({ tov: 4 })).toBe(-4);
  });

  it("scores a typical stat line correctly", () => {
    // 25pts, 8reb, 6ast, 1stl, 1blk, 9/18 FG, 3/4 FT, 2 3PM, 2tov
    const score = calculateESPNScore({
      pts: 25, reb: 8, ast: 6, stl: 1, blk: 1,
      fgm: 9, fga: 18, fg3m: 2, ftm: 3, fta: 4, tov: 2,
    });
    expect(score).toBeCloseTo(45.6, 1);
  });
});

// tier thresholds — these drive the badge labels on every player card
describe("assignTier", () => {
  it("returns Elite Start at 50 and above", () => {
    expect(assignTier(50)).toBe("Elite Start");
    expect(assignTier(75)).toBe("Elite Start");
  });

  it("returns Strong Start between 40 and 49", () => {
    expect(assignTier(40)).toBe("Strong Start");
    expect(assignTier(49)).toBe("Strong Start");
  });

  it("returns Flex Play between 30 and 39", () => {
    expect(assignTier(30)).toBe("Flex Play");
    expect(assignTier(39)).toBe("Flex Play");
  });

  it("returns Bench below 30", () => {
    expect(assignTier(29)).toBe("Bench");
    expect(assignTier(0)).toBe("Bench");
  });

  it("tier and score always agree at boundary values", () => {
    // 49.6 rounds to 50, so it should be Elite Start not Strong Start
    expect(assignTier(Math.round(49.6))).toBe("Elite Start");
    expect(assignTier(Math.round(49.4))).toBe("Strong Start");
  });
});

// ranking — players should come back sorted with correct rank stamps
describe("getRankedPlayers", () => {
  it("returns an array", () => {
    const players = getRankedPlayers();
    expect(Array.isArray(players)).toBe(true);
  });

  it("first player has rank 1 and the highest score", () => {
    const players = getRankedPlayers();
    expect(players[0].rank).toBe(1);
    expect(players[0].fantasyScore).toBeGreaterThanOrEqual(players[1].fantasyScore);
  });

  it("every player has a tier assigned", () => {
    const tiers = ["Elite Start", "Strong Start", "Flex Play", "Bench"];
    getRankedPlayers().forEach((p) => {
      expect(tiers).toContain(p.tier);
    });
  });

  it("ranks are sequential with no gaps", () => {
    const players = getRankedPlayers();
    players.forEach((p, i) => {
      expect(p.rank).toBe(i + 1);
    });
  });
});
