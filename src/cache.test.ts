import { jest } from "@jest/globals";
import fs from "node:fs";
import os from "node:os";
import { getYarnConfig, getYarnVersion } from "./yarn.js";

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
  it("should get the cache key", async () => {
    const { getCacheKey } = await import("./cache.js");

    mock.getYarnVersion.mockResolvedValue("1.2.3");

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
});
