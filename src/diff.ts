import { execSync } from "child_process";
import * as fs from "fs";

export interface DiffFile {
  filename: string;
  additions: string[];
  content: string;
}

// Parse a git diff and extract added lines per file
export function parseDiff(diffText: string): DiffFile[] {
  const files: DiffFile[] = [];
  const fileBlocks = diffText.split(/^diff --git/m).filter(Boolean);

  for (const block of fileBlocks) {
    const filenameMatch = block.match(/b\/(.+)\n/);
    if (!filenameMatch) continue;

    const filename = filenameMatch[1].trim();
    const additions = block
      .split("\n")
      .filter(line => line.startsWith("+") && !line.startsWith("+++"))
      .map(line => line.slice(1));

    if (additions.length > 0) {
      files.push({
        filename,
        additions,
        content: additions.join("\n")
      });
    }
  }

  return files;
}

// Get the diff of staged changes
export function getStagedDiff(): string {
  try {
    return execSync("git diff --cached", { encoding: "utf-8" });
  } catch {
    return "";
  }
}

// Get the diff of unstaged changes
export function getUnstagedDiff(): string {
  try {
    return execSync("git diff", { encoding: "utf-8" });
  } catch {
    return "";
  }
}

// Read a file directly
export function readFile(filepath: string): string {
  return fs.readFileSync(filepath, "utf-8");
}
