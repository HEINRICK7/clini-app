import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const sourceRoot = path.resolve(__dirname, "..");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(entryPath);
    return entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") ? [entryPath] : [];
  });
}

function importsInfrastructure(file: string): boolean {
  return /from\s+["'](?:@\/lib\/api\/client|@\/modules\/[^"']+\/(?:api|-api))["']/.test(readFileSync(file, "utf8"));
}

describe("frontend dependency boundaries", () => {
  it("keeps presentation files independent from HTTP adapters", () => {
    const presentationFiles = [
      ...sourceFiles(path.join(sourceRoot, "app")).filter((file) => !file.endsWith("services.ts")),
      ...sourceFiles(path.join(sourceRoot, "modules")).filter((file) => file.includes(`${path.sep}components${path.sep}`)),
    ];

    expect(presentationFiles.filter(importsInfrastructure)).toEqual([]);
  });

  it("keeps the composition root explicit", () => {
    const compositionRoot = readFileSync(path.join(sourceRoot, "app", "services.ts"), "utf8");
    expect(compositionRoot).toContain("export const cliniServices");
    expect(compositionRoot).toContain("dashboard: dashboardGateway");
  });
});
