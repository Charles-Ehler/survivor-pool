// Run: node test.js
const assert = require("assert");
const { WIKI, norm, parseCast, standings } = require("./pool.js");

const players = [
  { name: "A", picks: ["Patt Cannaday", "Mike Pinsky"] },
  { name: "B", picks: ["Alexis Levine", "Carter Krull"] },
];

// Money: Carter out first, Patt out third, 4 boots total.
const boots = ["Carter Krull", "X", "patt cannaday", "Y"];
const [a, b] = standings(players, boots);
assert.deepStrictEqual([a.total, b.total], [2 + 4, 4 + 0]);
assert.deepStrictEqual([a.net, b.net], [2, -2]);
assert.strictEqual(norm('Angelica "Jelly" Loblack'), "angelica loblack");

// Three players: nets still sum to zero.
const three = standings([...players, { name: "C", picks: ["Nobody", "X"] }], boots);
assert.strictEqual(three.reduce((s, p) => s + p.net, 0), 0);

// Parse the real page, then fake two boots into it.
fetch(WIKI).then(r => r.json()).then(({ parse }) => {
  const live = parseCast(parse.wikitext);
  assert.strictEqual(live.cast.length, 21);
  for (const p of players.flatMap(p => p.picks)) assert(live.cast.some(c => norm(c.name) === norm(p)), p);

  const fake = parse.wikitext
    .replace("{{sortname|Carter|Krull|nolink=1}}\n|24\n|[[Sioux Falls, South Dakota]]\n| {{void|stribe|savu}}\n|\n|\n|",
             "{{sortname|Carter|Krull|nolink=1}}\n|24\n|[[Sioux Falls, South Dakota]]\n| {{void|stribe|savu}}\n|\n|2nd voted out\n|5")
    .replace("{{sortname|Rob|Antonson|nolink=1}}\n|40\n|[[Cumberland, Rhode Island]]\n| {{void|stribe|savu}}\n|\n|\n|",
             "{{sortname|Rob|Antonson|nolink=1}}\n|40\n|[[Cumberland, Rhode Island]]\n| {{void|stribe|savu}}\n|\n|1st voted out\n|3");
  assert.deepStrictEqual(parseCast(fake).boots, ["Rob Antonson", "Carter Krull"]);
  console.log("ok");
});
