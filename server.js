import express from "express";
import axios from "axios";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// season usually tips off around Oct 19-24, request NBA stats for the new year on Oct 22nd
function getCurrentSeason() {
  const now = new Date();
  const cutover = new Date(now.getFullYear(), 9, 22);
  const year = now >= cutover ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${String(year + 1).slice(2)}`;
}

const PLAYER_STATS_FILE = path.resolve("./src/data/playerStats.js");
const GAME_LOGS_FILE = path.resolve("./src/data/gameLogs.js");

const NBA_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  Referer: "https://www.nba.com/",
  Origin: "https://www.nba.com",
  "Accept-Language": "en-US,en;q=0.9",
  Accept: "application/json, text/plain, */*",
};

const DASH_PLAYER_STATS_URL = "https://stats.nba.com/stats/leaguedashplayerstats";
const PLAYER_PROFILE_URL = "https://stats.nba.com/stats/commonplayerinfo";
const PLAYER_GAMES_URL = "https://stats.nba.com/stats/playergamelog";
const PLAYER_CAREER_URL = "https://stats.nba.com/stats/playercareerstats";
const ESPN_INJURIES_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries";

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCached(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

// Queues NBA API calls one at a time to avoid rate-limit errors.
// Tracks each request so if the browser cancels early, the queued call is dropped.
let _nbaQueue = Promise.resolve();
let _lastNbaCallEnd = 0;
const NBA_MIN_GAP_MS = 350; // minimum ms between successive NBA API calls

function queueNbaRequest(req, fn) {
  let abandoned = false;
  req.on("close", () => { abandoned = true; });

  const result = _nbaQueue.then(async () => {
    // Client already disconnected — skip the NBA call immediately
    if (abandoned) {
      const err = new Error("Client disconnected");
      err.abandoned = true;
      throw err;
    }

    const wait = Math.max(0, (_lastNbaCallEnd + NBA_MIN_GAP_MS) - Date.now());
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));

    // Re-check after the wait — client may have left during the gap
    if (abandoned) {
      const err = new Error("Client disconnected");
      err.abandoned = true;
      throw err;
    }

    try {
      const response = await fn();
      _lastNbaCallEnd = Date.now();
      return response;
    } catch (err) {
      _lastNbaCallEnd = Date.now();
      throw err;
    }
  });

  // A failed/abandoned item must not permanently block the queue
  _nbaQueue = result.catch(() => {});
  return result;
}

async function fetchWithRetry(fn, retries = 2, delayMs = 1200) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
}

function saveToFile(filePath, data, varName) {
  const fileContent = `const ${varName} = ${JSON.stringify(data, null, 2)};\n\nexport default ${varName};`;
  fs.writeFileSync(filePath, fileContent, "utf-8");
  console.log(`Saved ${varName} to ${filePath} with ${data.length} items`);
}

async function fetchAllPlayerStats(season) {
  const response = await axios.get(DASH_PLAYER_STATS_URL, {
    headers: NBA_HEADERS,
    params: {
      College: "",
      Conference: "",
      Country: "",
      DateFrom: "",
      DateTo: "",
      Division: "",
      DraftPick: "",
      DraftYear: "",
      GameScope: "",
      GameSegment: "",
      Height: "",
      LastNGames: 0,
      LeagueID: "00",
      Location: "",
      MeasureType: "Base",
      Month: 0,
      OpponentTeamID: 0,
      Outcome: "",
      PORound: 0,
      PaceAdjust: "N",
      PerMode: "PerGame",
      Period: 0,
      PlayerExperience: "",
      PlayerPosition: "",
      PlusMinus: "N",
      Rank: "N",
      Season: season,
      SeasonSegment: "",
      SeasonType: "Regular Season",
      ShotClockRange: "",
      StarterBench: "",
      TeamID: 0,
      TwoWay: 0,
      VsConference: "",
      VsDivision: "",
      Weight: "",
    },
    timeout: 20000,
  });

  const headers = response.data.resultSets[0].headers;
  const rows = response.data.resultSets[0].rowSet;

  return rows.map((row) => {
    const player = {};
    headers.forEach((key, idx) => (player[key] = row[idx]));

    return {
      id: player.PLAYER_ID,
      name: player.PLAYER_NAME,
      team: player.TEAM_ABBREVIATION,
      games: player.GP,
      pts: player.PTS,
      reb: player.REB,
      ast: player.AST,
      stl: player.STL,
      blk: player.BLK,
      fgPct: player.FG_PCT,
      threePct: player.FG3_PCT,
      ftPct: player.FT_PCT,
      minutes: player.MIN,
      fgm: player.FGM || 0,
      fga: player.FGA || 0,
      fg3m: player.FG3M || 0,
      ftm: player.FTM || 0,
      fta: player.FTA || 0,
      tov: player.TOV || 0,
      teamId: player.TEAM_ID || null,
      teamLogo: player.TEAM_ID
        ? `https://cdn.nba.com/logos/nba/${player.TEAM_ID}/primary/L/logo.svg`
        : null,
    };
  });
}

// pulls per-game stats for every player in the league from NBA.com
app.get("/api/all-players", async (req, res) => {
  const season = req.query.season || getCurrentSeason();
  const cacheKey = `all-players:${season}`;

  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    console.log(`Fetching fresh player stats for ${season}`);
    const statsPlayers = await queueNbaRequest(req, () =>
      fetchWithRetry(() => fetchAllPlayerStats(season))
    );
    saveToFile(PLAYER_STATS_FILE, statsPlayers, "playerStats");
    setCached(cacheKey, statsPlayers);
    res.json(statsPlayers);
  } catch (error) {
    if (error.abandoned) return;
    console.error("Error fetching player stats:", error.message);
    res.status(500).json({ error: "Failed to fetch player stats", details: error.message });
  }
});

// fetches a single player's profile — name, position, height, team, draft info
app.get("/api/player/:id", async (req, res) => {
  const playerId = Number(req.params.id);
  const cacheKey = `player:${playerId}`;

  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await queueNbaRequest(req, () =>
      fetchWithRetry(() =>
        axios.get(PLAYER_PROFILE_URL, {
          headers: NBA_HEADERS,
          params: { PlayerID: playerId, LeagueID: "00" },
          timeout: 20000,
        })
      )
    );

    const infoSet = response.data.resultSets[0];
    const row = infoSet.rowSet[0];
    const headers = infoSet.headers;

    const player = {};
    headers.forEach((key, idx) => (player[key] = row[idx]));

    const teamId = player.TEAM_ID || null;
    const playerData = {
      id: playerId,
      name: player.DISPLAY_FIRST_LAST,
      jersey: player.JERSEY,
      position: player.POSITION,
      height: player.HEIGHT,
      weight: player.WEIGHT,
      team: player.TEAM_NAME,
      teamAbbreviation: player.TEAM_ABBREVIATION,
      school: player.SCHOOL,
      country: player.COUNTRY,
      birthdate: player.BIRTHDATE || null,
      draftYear: player.DRAFT_YEAR,
      draftRound: player.DRAFT_ROUND,
      draftNumber: player.DRAFT_NUMBER,
      teamId,
      teamLogo: teamId
        ? `https://cdn.nba.com/logos/nba/${teamId}/primary/L/logo.svg`
        : null,
    };
    setCached(cacheKey, playerData);
    res.json(playerData);
  } catch (error) {
    if (error.abandoned) return;
    console.error("Error fetching player profile:", error.message);
    res.status(500).json({ error: "Failed to fetch player", details: error.message });
  }
});

// returns a game-by-game log for the player's current season
app.get("/api/player/:id/gamelogs", async (req, res) => {
  const playerId = Number(req.params.id);
  const season = req.query.season || getCurrentSeason();
  const cacheKey = `gamelogs:${playerId}:${season}`;

  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await queueNbaRequest(req, () =>
      fetchWithRetry(() =>
        axios.get(PLAYER_GAMES_URL, {
          headers: NBA_HEADERS,
          params: {
            PlayerID: playerId,
            Season: season,
            SeasonType: "Regular Season",
            LeagueID: "00",
          },
          timeout: 20000,
        })
      )
    );

    const resultSet = response.data.resultSets?.[0];
    const logs = (resultSet?.rowSet || []).map((row) => {
      const obj = {};
      resultSet.headers.forEach((key, idx) => (obj[key] = row[idx]));

      return {
        GAME_DATE: obj.GAME_DATE,
        TEAM: obj.TEAM_ABBREVIATION,
        OPP: obj.MATCHUP.split(" ")[2] || obj.MATCHUP,
        POS: obj.PLAYER_POSITION,
        FPTS: obj.PTS + obj.REB + obj.AST + obj.STL + obj.BLK,
        GS: obj.START_POSITION === "Starter" ? 1 : 0,
        MIN: obj.MIN,
        PTS: obj.PTS,
        REB: obj.REB,
        AST: obj.AST,
        BLK: obj.BLK,
        STL: obj.STL,
        "FG%": obj.FG_PCT ? (obj.FG_PCT * 100).toFixed(1) : 0,
        "FT%": obj.FT_PCT ? (obj.FT_PCT * 100).toFixed(1) : 0,
        "3P%": obj.FG3_PCT ? (obj.FG3_PCT * 100).toFixed(1) : 0,
        FTM: obj.FTM,
        "2PM": obj.FGM - obj.FG3M,
        "3PM": obj.FG3M,
        TOV: obj.TOV,
        DDBL: obj.DD2,
        TDBL: obj.TD3,
      };
    });

    saveToFile(GAME_LOGS_FILE, logs, "gameLogs");

    const responseData = { playerId, season, logs };
    setCached(cacheKey, responseData);
    res.json(responseData);
  } catch (err) {
    if (err.abandoned) return;
    console.error("Error fetching game logs:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// gets per-game averages for every season in a player's career
app.get("/api/player/:id/careerstats", async (req, res) => {
  const playerId = Number(req.params.id);
  const cacheKey = `career:${playerId}`;

  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await queueNbaRequest(req, () =>
      fetchWithRetry(() =>
        axios.get(PLAYER_CAREER_URL, {
          headers: NBA_HEADERS,
          params: { PlayerID: playerId, PerMode: "PerGame", LeagueID: "00" },
          timeout: 20000,
        })
      )
    );

    const resultSet = response.data.resultSets.find(
      (r) => r.name === "SeasonTotalsRegularSeason"
    );

    const seasons = (resultSet?.rowSet || []).map((row) => {
      const obj = {};
      resultSet.headers.forEach((key, idx) => (obj[key] = row[idx]));

          const year = parseInt(obj.SEASON_ID.substring(1));
      const season = `${year}-${year + 1}`;

      const fgm = obj.FGM || 0;
      const fg3m = obj.FG3M || 0;
      const fga = obj.FGA || 0;
      const ftm = obj.FTM || 0;
      const fta = obj.FTA || 0;

      const fptsG = (
        (obj.PTS || 0) * 1 +
        (obj.REB || 0) * 1.2 +
        (obj.AST || 0) * 1.5 +
        (obj.STL || 0) * 3 +
        (obj.BLK || 0) * 3 +
        fg3m * 1.5 -
        (fga - fgm) * 0.5 -
        (fta - ftm) * 0.5 -
        (obj.TOV || 0) * 1
      ).toFixed(1);

      return {
        SEASON: season,
        TEAM: obj.TEAM_ABBREVIATION,
        POS: "",
        GP: obj.GP,
        MIN: obj.MIN?.toFixed(1) ?? "0.0",
        PTS: obj.PTS,
        REB: obj.REB,
        AST: obj.AST,
        BLK: obj.BLK,
        STL: obj.STL,
        "FG%": obj.FG_PCT ? (obj.FG_PCT * 100).toFixed(1) : "0.0",
        "FT%": obj.FT_PCT ? (obj.FT_PCT * 100).toFixed(1) : "0.0",
        "3P%": obj.FG3_PCT ? (obj.FG3_PCT * 100).toFixed(1) : "0.0",
        FTM: ftm,
        FGA: fga,
        FTA: fta,
        "2PM": fgm - fg3m,
        "3PM": fg3m,
        TOV: obj.TOV || 0,
        "FPTS/G": fptsG,
      };
    });

    setCached(cacheKey, { seasons });
    res.json({ seasons });
  } catch (err) {
    if (err.abandoned) return;
    console.error("Error fetching career stats:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// grabs the current injury report from ESPN and maps it by player name
app.get("/api/injuries", async (_req, res) => {
  const cacheKey = "injuries";
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await axios.get(ESPN_INJURIES_URL, { timeout: 10000 });
    const teams = response.data.injuries || [];

    const injuryMap = {};
    for (const team of teams) {
      for (const entry of (team.injuries || [])) {
        const name = entry.athlete?.displayName;
        const status = entry.status;
        const type = entry.type?.description || "";
        if (name && status) {
          injuryMap[name] = { status, type };
        }
      }
    }

    setCached(cacheKey, injuryMap);
    res.json(injuryMap);
  } catch (err) {
    console.error("Error fetching injury report:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`NBA Proxy running on http://localhost:${PORT}`);
});