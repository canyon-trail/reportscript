import { readFileSync, writeFileSync, rmSync, readdirSync } from "fs";
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

spawnSync(
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

const docsPath = join(__dirname, "docs");
const modulesFilePath = join(docsPath, "modules.md");

const contents = readFileSync(modulesFilePath, { encoding: "utf-8" });
const date = new Date().toISOString().split("T")[0];

const filename = `${date}-documentation.md`;
const docPage = "---\ntitle: Documentation\n---\n\n" + contents.replace(/modules.md/g, "");
const postsPath = join(__dirname, "../", "documentation", "_posts");

const currentPosts = readdirSync(postsPath);
const oldDocs = currentPosts.find(x => x.match(/documentation.md/));

if (oldDocs) {
  rmSync(join(postsPath, oldDocs));
}

const newDocsPath = join(postsPath, filename);
writeFileSync(newDocsPath, docPage);

rmSync(docsPath, { recursive: true, force: true });