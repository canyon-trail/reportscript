import { readFileSync, writeFileSync, rmSync } from "fs";
import spawn from "cross-spawn";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

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
  ]
);

const tempDocsPath = join(__dirname, "docs");
const modulesFilePath = join(tempDocsPath, "modules.md");

const contents = readFileSync(modulesFilePath, { encoding: "utf-8" });

const filename = "documentation.md";

const tabTags = [
  "---",
  "icon: fa-solid fa-book",
  "order: 4",
  "layout: post",
  "---"
].join("\n") + "\n";

const docPage = tabTags + contents.replace(/modules.md/g, "");

const tabsPaths = join(__dirname, "../", "documentation", "_tabs");

const newDocsPath = join(tabsPaths, filename);
writeFileSync(newDocsPath, docPage);

rmSync(tempDocsPath, { recursive: true, force: true });