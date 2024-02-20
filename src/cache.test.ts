import * as core from "@actions/core";
import { jest } from "@jest/globals";
import fs from "node:fs";
import os from "node:os";
import { getYarnConfig, getYarnVersion } from "./yarn/index.js";

const mock = {
  core: {
    info: jest.fn<typeof core.info>(),
    warning: jest.fn<typeof core.warning>(),
  },
  fs: {
    existsSync: jest.fn<typeof fs.existsSync>(),
  },
  hashFile: jest.fn(),
  getYarnConfig: jest.fn<typeof getYarnConfig>(),
  getYarnVersion: jest.fn<typeof getYarnVersion>(),
};

jest.unstable_mockModule("@actions/core", () => mock.core);
jest.unstable_mockModule("node:fs", () => ({
  default: mock.fs,
}));
jest.unstable_mockModule("hasha", () => ({
  hashFile: mock.hashFile,
}));
jest.unstable_mockModule("./yarn.js", () => ({
  getYarnConfig: mock.getYarnConfig,
  getYarnVersion: mock.getYarnVersion,
}));

let logs: (string | Error)[] = [];

beforeEach(() => {
  jest.clearAllMocks();

  logs = [];
  mock.core.info.mockImplementation((message) => {
    logs.push(message);
  });
  mock.core.warning.mockImplementation((message) => {
    logs.push(message);
  });
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

    expect(logs).toStrictEqual([
      "Getting Yarn version...",
      "Calculating lock file hash...",
      `Using cache key: yarn-install-action-${os.type()}-1.2.3-b1484caea0bbcbfa9a3a32591e3cad5d`,
    ]);
    expect(cacheKey).toBe(
      `yarn-install-action-${os.type()}-1.2.3-b1484caea0bbcbfa9a3a32591e3cad5d`,
    );
  });

  it("should get the cache key if there is no lock file", async () => {
    const { getCacheKey } = await import("./cache.js");

    mock.fs.existsSync.mockReturnValue(false);

    const cacheKey = await getCacheKey();

    expect(logs).toStrictEqual([
      "Getting Yarn version...",
      "Calculating lock file hash...",
      "Lock file could not be found, using empty hash",
      `Using cache key: yarn-install-action-${os.type()}-1.2.3`,
    ]);
    expect(cacheKey).toBe(`yarn-install-action-${os.type()}-1.2.3`);
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
