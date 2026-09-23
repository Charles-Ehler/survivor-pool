// Pool logic. No page code here, so test.js can run it in node.

const WIKI = "https://en.wikipedia.org/w/api.php?action=parse&page=Survivor_51&prop=wikitext&format=json&formatversion=2&origin=*";

// "Angelica "Jelly" Loblack" and "angelica loblack" should match.
const norm = s => s.replace(/"[^"]*"/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

// Reads the Contestants table. Returns every castaway, and the ones who are
// gone in the order they left (by day, then by "Nth voted out").
function parseCast(wikitext) {
  const table = (wikitext.split(/==\s*Contestants\s*==/)[1] || "").split("\n|}")[0];
  const cast = [];
  for (const row of table.split("\n|-")) {
    const m = row.match(/\{\{sortname\|([^|}]+)\|([^|}]+)/);
    if (!m) continue;
    const exit = row.match(/(\d+)(?:st|nd|rd|th) voted out|evacuated|quit|eliminated|lost fire/i);
    const numbers = row.split("\n").filter(l => l.startsWith("|")).map(l => l.match(/(\d+)\s*$/)).filter(Boolean);
    cast.push({
      name: `${m[1]} ${m[2]}`.replace(/\s+/g, " ").trim(),
      tribe: (row.match(/stribe\|(\w+)/) || [])[1] || "none",
      out: !!exit,
      day: exit && numbers.length > 1 ? +numbers.at(-1)[1] : 0,
      nth: exit && exit[1] ? +exit[1] : 0,
    });
  }
  const boots = cast.filter(c => c.out).sort((a, b) => a.day - b.day || a.nth - b.nth).map(c => c.name);
  return { cast, boots };
}

// Every boot, each pick still in the game earns $1. Everyone settles with
// everyone, so your net is what you earned over each other player, added up.
function standings(players, boots) {
  const earned = pick => {
    const i = boots.findIndex(b => norm(b) === norm(pick));
    return i === -1 ? boots.length : i;
  };
  const totals = players.map(p => p.picks.reduce((s, k) => s + earned(k), 0));
  const sum = totals.reduce((a, b) => a + b, 0);
  return players.map((p, i) => ({
    name: p.name,
    total: totals[i],
    net: players.length * totals[i] - sum,
    picks: p.picks.map(k => ({ name: k, earned: earned(k), out: earned(k) < boots.length })),
  }));
}

if (typeof module !== "undefined") module.exports = { WIKI, norm, parseCast, standings };
