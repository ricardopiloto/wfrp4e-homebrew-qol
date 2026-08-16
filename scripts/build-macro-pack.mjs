/**
 * Build ClassicLevel macro pack from JSON source (dev helper; not loaded by Foundry).
 * Usage: node scripts/build-macro-pack.mjs
 */
import { ClassicLevel } from "classic-level";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const packDir = path.join(root, "packs", "homebrew-qol-macros");
const sourceDir = path.join(packDir, "_source");

fs.mkdirSync(sourceDir, { recursive: true });

const doc = {
  _id: "HbQolDtMnU001",
  name: "Homebrew QoL — Downtime",
  type: "script",
  author: "",
  img: "icons/svg/book.svg",
  scope: "global",
  command:
    "game.wfrp4eHomebrewQol?.openDowntimeMenu?.() ?? game.modules.get(\"wfrp4e-homebrew-qol\")?.api?.openDowntimeMenu?.();",
  folder: null,
  sort: 0,
  ownership: { default: 0 },
  flags: {},
  _stats: {
    coreVersion: "13.342",
    systemId: "wfrp4e",
    systemVersion: "9.0.0",
    createdTime: Date.now(),
    modifiedTime: Date.now(),
    lastModifiedBy: null,
  },
};

const sourceFile = path.join(sourceDir, `${doc.name.replace(/[^\w]+/g, "_")}_${doc._id}.json`);
fs.writeFileSync(sourceFile, `${JSON.stringify(doc, null, 2)}\n`);

// Remove previous LevelDB files but keep _source
for (const name of fs.readdirSync(packDir)) {
  if (name === "_source") continue;
  fs.rmSync(path.join(packDir, name), { recursive: true, force: true });
}

const db = new ClassicLevel(packDir, { keyEncoding: "utf8", valueEncoding: "json" });
await db.open();
await db.put(doc._id, doc);
await db.close();

console.log(`Packed macro into ${packDir}`);
console.log(`Source: ${sourceFile}`);
