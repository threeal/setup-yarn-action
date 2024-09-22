import { jest } from "@jest/globals";
import os from "node:os";

jest.unstable_mockModule("gha-utils", () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarning: jest.fn(),
}));

jest.unstable_mockModule("hasha", () => ({
  hashFile: jest.fn(),
}));

jest.unstable_mockModule("node:fs", () => ({
  default: {
    existsSync: jest.fn(),
  },
}));

jest.unstable_mockModule("./yarn.js", () => ({
  getYarnConfig: jest.fn(),
  getYarnVersion: jest.fn(),
}));

let logs: unknown[] = [];

beforeEach(async () => {
  const { logError, logInfo, logWarning } = await import("gha-utils");

  logs = [];

  jest.mocked(logInfo).mockImplementation((message) => {
    logs.push(message);
  });
  jest.mocked(logError).mockImplementation((message) => {
    logs.push(message);
  });
  jest.mocked(logWarning).mockImplementation((message) => {
    logs.push(message);
  });
});

describe("get cache key", () => {
  beforeEach(async () => {
    const { hashFile } = await import("hasha");
    const fs = (await import("node:fs")).default;
    const { getYarnVersion } = await import("./yarn/index.js");

    (hashFile as jest.Mock).mockImplementation(async (filePath) => {
      if (filePath == "yarn.lock") return "b1484caea0bbcbfa9a3a32591e3cad5d";
      throw new Error(`file not found: ${filePath}`);
    });

    jest.mocked(fs.existsSync).mockImplementation((path) => {
      if (path == "yarn.lock") return true;
      return false;
    });

    jest.mocked(getYarnVersion).mockImplementation(async (options) => {
      if (options?.corepack) return "1.2.3";
      throw new Error("Unable to get Yarn version");
    });
  });

  it("should failed to get Yarn version", async () => {
    const { getYarnVersion } = await import("./yarn/index.js");
    const { getCacheKey } = await import("./cache.js");

    jest.mocked(getYarnVersion).mockRejectedValue(new Error("some error"));

    const prom = getCacheKey();

    await expect(prom).rejects.toThrow("Failed to get Yarn version");
    expect(logs).toStrictEqual([
      "Getting Yarn version...",
      "Failed to get Yarn version: some error",
    ]);
  });

  it("should failed to calculate lock file hash", async () => {
    const { hashFile } = await import("hasha");
    const { getCacheKey } = await import("./cache.js");

    jest.mocked(hashFile).mockRejectedValue(new Error("some error"));

    const prom = getCacheKey();

    await expect(prom).rejects.toThrow("Failed to calculate lock file hash");
    expect(logs).toStrictEqual([
      "Getting Yarn version...",
      "Calculating lock file hash...",
      "Failed to calculate lock file hash: some error",
    ]);
  });

  it("should get the cache key", async () => {
    const { getCacheKey } = await import("./cache.js");

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
    beforeEach(async () => {
      const fs = (await import("node:fs")).default;

      jest.mocked(fs.existsSync).mockReturnValue(false);
    });

    it("should get the cache key", async () => {
      const { getCacheKey } = await import("./cache.js");

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
  beforeEach(async () => {
    const { getYarnConfig } = await import("./yarn/index.js");

    jest.mocked(getYarnConfig).mockImplementation(async (name) => {
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
    const { getYarnConfig } = await import("./yarn/index.js");
    const { getCachePaths } = await import("./cache.js");

    jest.mocked(getYarnConfig).mockRejectedValue(new Error("some error"));

    const prom = getCachePaths();

    await expect(prom).rejects.toThrow("Failed to get Yarn cache folder");
    expect(logs).toStrictEqual([
      "Getting Yarn cache folder...",
      "Failed to get Yarn cache folder: some error",
    ]);
  });

  it("should get the cache paths", async () => {
    const { getCachePaths } = await import("./cache.js");

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
