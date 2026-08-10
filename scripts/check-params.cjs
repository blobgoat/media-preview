// Checks src/main.config.ts's parameters block against Workshop's two hard, silent limits:
// at most 50 top-level parameters, and every displayName capped at 100 characters. Run after
// any change to main.config.ts — see README.md.
//
// Parses the whole "parameters: {}" block as one string and extracts each displayName
// expression up to the following "type:" key, rather than a naive per-line regex (which
// mis-parses the common multi-line `displayName:\n  "a" + "b",` pattern some formatters
// produce).
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "..", "src", "main.config.ts");
const src = fs.readFileSync(configPath, "utf8");
const m = src.match(/parameters:\s*\{([\s\S]*?)\n  \},\n  events:/);
if (!m) {
  throw new Error(
    "Couldn't find the parameters block in src/main.config.ts — check the surrounding markers " +
      "(expects `parameters: { ... },\n  events:` at 2-space indent).",
  );
}
const body = m[1];
const re = /(\w+):\s*\{\s*displayName:\s*([\s\S]*?),\s*type:/g;
let count = 0;
let match;
const bad = [];
while ((match = re.exec(body))) {
  count++;
  let val;
  try {
    // eslint-disable-next-line no-eval
    val = eval(match[2]);
  } catch (e) {
    val = `EVAL_ERROR: ${e.message}`;
  }
  if (typeof val !== "string" || val.length > 100) {
    bad.push([match[1], typeof val === "string" ? val.length : val]);
  }
}

console.log(`param count: ${count} (limit 50)`);
console.log("over-limit or unparseable displayNames:", bad);

if (count > 50 || bad.length > 0) {
  process.exitCode = 1;
}
