import { jest } from "@jest/globals";
import os from "node:os";

jest.unstable_mockModule("@actions/core", () => ({
  info: jest.fn(),
  warning: jest.fn(),
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

let logs: (string | Error)[] = [];

beforeEach(async () => {
  const core = await import("@actions/core");

  jest.clearAllMocks();

  logs = [];
  jest.mocked(core.info).mockImplementation((message) => {
    logs.push(message);
  });
  jest.mocked(core.warning).mockImplementation((message) => {
    logs.push(message);
  });
});

describe("Getting the cache key", () => {
  beforeEach(async () => {
    const { getYarnVersion } = await import("./yarn/index.js");

    jest.mocked(getYarnVersion).mockResolvedValue("1.2.3");
  });

  it("should get the cache key", async () => {
    const { hashFile } = await import("hasha");
    const fs = (await import("node:fs")).default;
    const { getCacheKey } = await import("./cache.js");

    jest.mocked(fs.existsSync).mockImplementation((path) => {
      if (path == "yarn.lock") return true;
      return false;
    });

    (hashFile as jest.Mock).mockImplementation(async (filePath) => {
      if (filePath == "yarn.lock") return "b1484caea0bbcbfa9a3a32591e3cad5d";
      throw new Error(`file not found: ${filePath}`);
    });

    const cacheKey = await getCacheKey();
    const expectedCacheKey = `setup-yarn-action-${os.type()}-1.2.3-b1484caea0bbcbfa9a3a32591e3cad5d`;

    expect(logs).toStrictEqual([
      "Getting Yarn version...",
      "Calculating lock file hash...",
      `Using cache key: ${expectedCacheKey}`,
    ]);
    expect(cacheKey).toBe(expectedCacheKey);
  });

  it("should get the cache key if there is no lock file", async () => {
    const fs = (await import("node:fs")).default;
    const { getCacheKey } = await import("./cache.js");

    jest.mocked(fs.existsSync).mockReturnValue(false);

    const cacheKey = await getCacheKey();
    const expectedCacheKey = `setup-yarn-action-${os.type()}-1.2.3`;

    expect(logs).toStrictEqual([
      "Getting Yarn version...",
      "Calculating lock file hash...",
      "Lock file could not be found, using empty hash",
      `Using cache key: ${expectedCacheKey}`,
    ]);
    expect(cacheKey).toBe(expectedCacheKey);
  });
});

it("should get the cache paths", async () => {
  const { getYarnConfig } = await import("./yarn/index.js");
  const { getCachePaths } = await import("./cache.js");

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
