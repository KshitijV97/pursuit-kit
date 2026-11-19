import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { access, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export function extractMermaidBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const pattern = /```mermaid\r?\n([\s\S]*?)```/g;

  for (const match of markdown.matchAll(pattern)) {
    const block = (match[1] ?? "").trim();
    if (block.length > 0) {
      blocks.push(block);
    }
  }

  return blocks;
}

async function markdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await markdownFiles(path)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path);
    }
  }

  return files.sort();
}

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with ${code}`));
      }
    });
  });
}

/**
 * Renders every Mermaid block in docs/ so a syntax error fails the docs job (KTD15).
 * Uses @mermaid-js/mermaid-cli: a local install, a global `mmdc` on PATH, or npx.
 * MMDC_PUPPETEER_CONFIG passes a Puppeteer config, which CI needs to disable the Chromium sandbox.
 */
async function main(): Promise<void> {
  const root = process.argv[2] ?? "docs";
  const files = await markdownFiles(root);
  const work = await mkdtemp(join(tmpdir(), "pursuit-kit-mermaid-"));

  async function exists(path: string): Promise<boolean> {
    return access(path).then(
      () => true,
      () => false,
    );
  }

  async function resolveRunner(): Promise<(args: string[]) => Promise<void>> {
    if (process.env.MMDC) {
      return (args) => run(process.env.MMDC as string, args);
    }

    const local = join(process.cwd(), "node_modules", ".bin", "mmdc");
    if (await exists(local)) {
      return (args) => run(local, args);
    }

    const onPath = (process.env.PATH ?? "")
      .split(":")
      .filter((entry) => entry.length > 0)
      .map((entry) => join(entry, "mmdc"))
      .find((candidate) => existsSync(candidate));

    if (onPath) {
      return (args) => run(onPath, args);
    }

    return (args) => run("npx", ["-y", "@mermaid-js/mermaid-cli", ...args]);
  }

  const puppeteerConfig = process.env.MMDC_PUPPETEER_CONFIG;
  const extraArgs = puppeteerConfig ? ["-p", puppeteerConfig] : [];
  const runner = await resolveRunner();
  let checked = 0;

  try {
    for (const file of files) {
      const blocks = extractMermaidBlocks(await readFile(file, "utf8"));

      for (const block of blocks) {
        const input = join(work, `diagram-${checked}.mmd`);
        const output = join(work, `diagram-${checked}.svg`);
        await writeFile(input, block, "utf8");

        await runner(["-i", input, "-o", output, "-b", "transparent", ...extraArgs]);

        checked += 1;
      }

      console.log(`ok  ${file}`);
    }
  } finally {
    await rm(work, { recursive: true, force: true });
  }

  if (checked === 0) {
    throw new Error(`No Mermaid diagrams found under ${root}.`);
  }

  console.log(`Rendered ${checked} Mermaid diagrams.`);
}

const invokedPath = process.argv[1] ? fileURLToPath(import.meta.url) === process.argv[1] : false;

if (invokedPath) {
  await main();
}
