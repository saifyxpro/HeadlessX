import { cpSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const sourceDir = path.resolve("src/data-files");
const targetDir = path.resolve("dist/data-files");

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(path.dirname(targetDir), { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true });
