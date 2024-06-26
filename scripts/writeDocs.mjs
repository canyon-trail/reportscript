import { readFileSync, writeFileSync, rmSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import spawn from "cross-spawn"
const __dirname = dirname(fileURLToPath(import.meta.url));

spawn.sync(
  "npx",
  [
    "typedoc",
    "--entryPoints",
    "src/index.ts",
    "--plugin",
    "typedoc-plugin-markdown",
    "--out",
    "scripts/docs",
    "--hideInPageTOC",
    "true"
  ]
);

const tempDocsPath = join(__dirname, "docs");
const modulesFilePath = join(tempDocsPath, "modules.md");

const contents = readFileSync(modulesFilePath, { encoding: "utf-8" });
const modifiedContents = contents.split('\n').slice(4).join('\n');
const filename = "documentation.md";

const tabTags = [
  "---",
  "icon: fa-solid fa-book",
  "order: 3",
  "layout: post",
  "---"
].join("\n") + "\n";

const docPage = tabTags + modifiedContents
  .replace(/modules.md/g, "")

const tabsPaths = join(__dirname, "../", "documentation", "_tabs");

const newDocsPath = join(tabsPaths, filename);
writeFileSync(newDocsPath, docPage);

rmSync(tempDocsPath, { recursive: true, force: true });
