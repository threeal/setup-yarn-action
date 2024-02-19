import { jest } from "@jest/globals";
import fs from "node:fs";
import os from "node:os";
import { getYarnConfig, getYarnVersion } from "./yarn/index.js";

const mock = {
  fs: {
    existsSync: jest.fn<typeof fs.existsSync>(),
  },
  hashFile: jest.fn(),
  getYarnConfig: jest.fn<typeof getYarnConfig>(),
  getYarnVersion: jest.fn<typeof getYarnVersion>(),
};

jest.unstable_mockModule("hasha", () => ({
  hashFile: mock.hashFile,
}));

jest.unstable_mockModule("node:fs", () => ({
  default: mock.fs,
}));

jest.unstable_mockModule("./yarn.js", () => ({
  getYarnConfig: mock.getYarnConfig,
  getYarnVersion: mock.getYarnVersion,
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Getting the cache key", () => {
  beforeEach(() => {
    mock.getYarnVersion.mockResolvedValue("1.2.3");
  });

  it("should get the cache key", async () => {
    const { getCacheKey } = await import("./cache.js");

    mock.fs.existsSync.mockImplementation((path) => {
      if (path == "yarn.lock") return true;
      return false;
    });

    mock.hashFile.mockImplementation(async (filePath) => {
      if (filePath == "yarn.lock") return "b1484caea0bbcbfa9a3a32591e3cad5d";
      throw new Error(`file not found: ${filePath}`);
    });

    const cacheKey = await getCacheKey();

    expect(cacheKey).toBe(
      `yarn-install-action-${os.type()}-1.2.3-b1484caea0bbcbfa9a3a32591e3cad5d`,
    );
  });

  it("should not get the cache key if there is no lock file", async () => {
    const { getCacheKey } = await import("./cache.js");

    mock.fs.existsSync.mockReturnValue(false);

    const cacheKey = await getCacheKey();

    expect(cacheKey).toBeUndefined();
  });
});

it("should get the cache paths", async () => {
  const { getCachePaths } = await import("./cache.js");

  mock.getYarnConfig.mockImplementation(async (name) => {
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

  expect(cachePaths).toStrictEqual([
    ".yarn/cache",
    ".yarn/versions",
    ".yarn/install-state.gz",
    ".yarn/patches",
    ".yarn/unplugged",
    ".yarn/__virtual__",
    ".yarn",
    ".pnp.cjs",
    ".pnp.loader.mjs",
  ]);
});
