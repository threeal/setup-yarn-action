import { logError, logInfo, logWarning } from "gha-utils";
import { hashFile } from "hasha";
import fs from "node:fs";
import os from "node:os";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCacheKey, getCachePaths } from "./cache.js";
import { getYarnConfig, getYarnVersion } from "./yarn/index.js";

vi.mock("gha-utils", () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
  logWarning: vi.fn(),
}));

vi.mock("hasha", () => ({ hashFile: vi.fn() }));

vi.mock("node:fs", () => ({ default: { existsSync: vi.fn() } }));

vi.mock("./yarn/index.js", () => ({
  getYarnConfig: vi.fn(),
  getYarnVersion: vi.fn(),
}));

let logs: unknown[] = [];

beforeEach(() => {
  logs = [];

  vi.mocked(logInfo).mockImplementation((message) => {
    logs.push(message);
  });
  vi.mocked(logError).mockImplementation((message) => {
    logs.push(message);
  });
  vi.mocked(logWarning).mockImplementation((message) => {
    logs.push(message);
  });
});

describe("get cache key", () => {
  beforeEach(() => {
    vi.mocked(hashFile).mockImplementation((async (filePath) => {
      if (filePath == "yarn.lock") return "b1484caea0bbcbfa9a3a32591e3cad5d";
      throw new Error(`file not found: ${filePath}`);
    }) as typeof hashFile);

    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (path == "yarn.lock") return true;
      return false;
    });

    vi.mocked(getYarnVersion).mockImplementation(async (options) => {
      if (options?.corepack) return "1.2.3";
      throw new Error("Unable to get Yarn version");
    });
  });

  it("should failed to get Yarn version", async () => {
    vi.mocked(getYarnVersion).mockRejectedValue(new Error("some error"));

    const prom = getCacheKey();

    await expect(prom).rejects.toThrow("Failed to get Yarn version");
    expect(logs).toStrictEqual([
      "Getting Yarn version...",
      "Failed to get Yarn version: some error",
    ]);
  });

  it("should failed to calculate lock file hash", async () => {
    vi.mocked(hashFile).mockRejectedValue(new Error("some error"));

    const prom = getCacheKey();

    await expect(prom).rejects.toThrow("Failed to calculate lock file hash");
    expect(logs).toStrictEqual([
      "Getting Yarn version...",
      "Calculating lock file hash...",
      "Failed to calculate lock file hash: some error",
    ]);
  });

  it("should get the cache key", async () => {
    const actual = await getCacheKey();
    const expected = {
      key: `setup-yarn-action-${os.type()}`,
      version: `1.2.3-b1484caea0bbcbfa9a3a32591e3cad5d`,
    };

    expect(logs).toStrictEqual([
      "Getting Yarn version...",
      "Calculating lock file hash...",
      `Using cache key: ${expected.key}-${expected.version}`,
    ]);
    expect(actual).toEqual(expected);
  });

  describe("without existing lock file", () => {
    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
    });

    it("should get the cache key", async () => {
      const actual = await getCacheKey();
      const expected = {
        key: `setup-yarn-action-${os.type()}`,
        version: `1.2.3`,
      };

      expect(logs).toStrictEqual([
        "Getting Yarn version...",
        "Calculating lock file hash...",
        "Lock file could not be found, using empty hash",
        `Using cache key: ${expected.key}-${expected.version}`,
      ]);
      expect(actual).toEqual(expected);
    });
  });
});

describe("get cache paths", () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(true);

    vi.mocked(getYarnConfig).mockImplementation(async (name) => {
      switch (name) {
        case "cacheFolder":
          return ".yarn/cache";
        case "deferredVersionFolder":
          return ".yarn/versions";
        case "installStatePath":
          return ".yarn/install-state.gz";
        case "patchFolder":
          return ".yarn/patches";
        case "pnpUnpluggedFolder":
          return ".yarn/unplugged";
        case "virtualFolder":
          return ".yarn/__virtual__";
      }
      throw new Error(`unknown config: ${name}`);
    });
  });

  it("should failed to get Yarn config", async () => {
    vi.mocked(getYarnConfig).mockRejectedValue(new Error("some error"));

    const prom = getCachePaths();

    await expect(prom).rejects.toThrow("Failed to get Yarn cache folder");
    expect(logs).toStrictEqual([
      "Getting Yarn cache folder...",
      "Failed to get Yarn cache folder: some error",
    ]);
  });

  it("should get the cache paths", async () => {
    const cachePaths = await getCachePaths();
    const expectedCachePaths = [
      ".pnp.cjs",
      ".pnp.loader.mjs",
      ".yarn/cache",
      ".yarn/versions",
      ".yarn/install-state.gz",
      ".yarn/patches",
      ".yarn/unplugged",
      ".yarn/__virtual__",
    ];

    expect(logs).toStrictEqual([
      "Getting Yarn cache folder...",
      "Getting Yarn deferred version folder...",
      "Getting Yarn install state path...",
      "Getting Yarn patch folder...",
      "Getting Yarn PnP unplugged folder...",
      "Getting Yarn virtual folder...",
      `Using cache paths: ${JSON.stringify(expectedCachePaths, null, 4)}`,
    ]);
    expect(cachePaths).toStrictEqual(expectedCachePaths);
  });
});
