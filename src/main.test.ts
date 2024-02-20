import { jest } from "@jest/globals";

jest.unstable_mockModule("@actions/cache", () => ({
  restoreCache: jest.fn(),
  saveCache: jest.fn(),
}));

jest.unstable_mockModule("./yarn/index.js", () => ({
  enableYarn: jest.fn(),
  yarnInstall: jest.fn(),
}));

jest.unstable_mockModule("./cache.js", () => ({
  getCacheKey: jest.fn(),
  getCachePaths: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("install Yarn dependencies", () => {
  const cacheKey = "a-cache-key";
  const cachePaths = ["a/cahe/paths", "another/cache/paths"];

  beforeEach(async () => {
    const { getCacheKey, getCachePaths } = await import("./cache.js");

    jest.mocked(getCacheKey).mockResolvedValue(cacheKey);
    jest.mocked(getCachePaths).mockResolvedValue(cachePaths);
  });

  it("should install Yarn dependencies and save to cache", async () => {
    const { restoreCache, saveCache } = await import("@actions/cache");
    const { enableYarn, yarnInstall } = await import("./yarn/index.js");
    const { getCacheKey, getCachePaths } = await import("./cache.js");
    const { main } = await import("./main.js");

    jest.mocked(restoreCache).mockResolvedValue(undefined);

    await main();

    expect(enableYarn).toHaveBeenCalledTimes(1);
    expect(getCacheKey).toHaveBeenCalledTimes(1);
    expect(getCachePaths).toHaveBeenCalledTimes(1);

    expect(restoreCache).toHaveBeenCalledTimes(1);
    expect(restoreCache).toHaveBeenCalledWith(cachePaths, cacheKey);

    expect(yarnInstall).toHaveBeenCalledTimes(1);

    expect(saveCache).toHaveBeenCalledTimes(1);
    expect(saveCache).toHaveBeenCalledWith(cachePaths, cacheKey);
  });

  it("should restore Yarn dependencies cache without install and save", async () => {
    const { restoreCache, saveCache } = await import("@actions/cache");
    const { enableYarn, yarnInstall } = await import("./yarn/index.js");
    const { getCacheKey, getCachePaths } = await import("./cache.js");
    const { main } = await import("./main.js");

    jest.mocked(restoreCache).mockResolvedValue(cacheKey);

    await main();

    expect(enableYarn).toHaveBeenCalledTimes(1);
    expect(getCacheKey).toHaveBeenCalledTimes(1);
    expect(getCachePaths).toHaveBeenCalledTimes(1);

    expect(restoreCache).toHaveBeenCalledTimes(1);
    expect(restoreCache).toHaveBeenCalledWith(cachePaths, cacheKey);

    expect(yarnInstall).toHaveBeenCalledTimes(0);
    expect(saveCache).toHaveBeenCalledTimes(0);
  });
});
