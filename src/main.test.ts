import { restoreCache, saveCache } from "@actions/cache";
import { jest } from "@jest/globals";
import { enableYarn, yarnInstall } from "./yarn/index.js";
import { getCacheKey, getCachePaths } from "./cache.js";

const mock = {
  enableYarn: jest.fn<typeof enableYarn>(),
  getCacheKey: jest.fn<typeof getCacheKey>(),
  getCachePaths: jest.fn<typeof getCachePaths>(),
  restoreCache: jest.fn<typeof restoreCache>(),
  saveCache: jest.fn<typeof saveCache>(),
  yarnInstall: jest.fn<typeof yarnInstall>(),
};

jest.unstable_mockModule("@actions/cache", () => ({
  restoreCache: mock.restoreCache,
  saveCache: mock.saveCache,
}));
jest.unstable_mockModule("./yarn/index.js", () => ({
  enableYarn: mock.enableYarn,
  yarnInstall: mock.yarnInstall,
}));
jest.unstable_mockModule("./cache.js", () => ({
  getCacheKey: mock.getCacheKey,
  getCachePaths: mock.getCachePaths,
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("install Yarn dependencies", () => {
  const cacheKey = "a-cache-key";
  const cachePaths = ["a/cahe/paths", "another/cache/paths"];

  beforeEach(() => {
    mock.getCacheKey.mockResolvedValue(cacheKey);
    mock.getCachePaths.mockResolvedValue(cachePaths);
  });

  it("should install Yarn dependencies and save to cache", async () => {
    const { main } = await import("./main.js");

    mock.restoreCache.mockResolvedValue(undefined);

    await main();

    expect(mock.enableYarn).toHaveBeenCalledTimes(1);
    expect(mock.getCacheKey).toHaveBeenCalledTimes(1);
    expect(mock.getCachePaths).toHaveBeenCalledTimes(1);

    expect(mock.restoreCache).toHaveBeenCalledTimes(1);
    expect(mock.restoreCache).toHaveBeenCalledWith(cachePaths, cacheKey);

    expect(mock.yarnInstall).toHaveBeenCalledTimes(1);

    expect(mock.saveCache).toHaveBeenCalledTimes(1);
    expect(mock.saveCache).toHaveBeenCalledWith(cachePaths, cacheKey);
  });

  it("should restore Yarn dependencies cache without install and save", async () => {
    const { main } = await import("./main.js");

    mock.restoreCache.mockResolvedValue(cacheKey);

    await main();

    expect(mock.enableYarn).toHaveBeenCalledTimes(1);
    expect(mock.getCacheKey).toHaveBeenCalledTimes(1);
    expect(mock.getCachePaths).toHaveBeenCalledTimes(1);

    expect(mock.restoreCache).toHaveBeenCalledTimes(1);
    expect(mock.restoreCache).toHaveBeenCalledWith(cachePaths, cacheKey);

    expect(mock.yarnInstall).toHaveBeenCalledTimes(0);
    expect(mock.saveCache).toHaveBeenCalledTimes(0);
  });
});
