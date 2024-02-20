import { jest } from "@jest/globals";

jest.unstable_mockModule("@actions/cache", () => ({
  restoreCache: jest.fn(),
  saveCache: jest.fn(),
}));

jest.unstable_mockModule("@actions/core", () => ({
  group: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
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

  let logs: (string | Error)[] = [];

  beforeEach(async () => {
    const core = await import("@actions/core");
    const { getCacheKey, getCachePaths } = await import("./cache.js");

    logs = [];
    jest.mocked(core.group).mockImplementation(async (name, fn) => {
      logs.push(`::group::${name}`);
      const res = await fn();
      logs.push(`::endgroup::`);
      return res;
    });
    jest.mocked(core.info).mockImplementation((message) => {
      logs.push(message);
    });
    jest.mocked(core.warning).mockImplementation((message) => {
      logs.push(message);
    });

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

    expect(logs).toStrictEqual([
      "Enabling Yarn...",
      "::group::Getting cache key",
      "::endgroup::",
      "::group::Getting cache paths",
      "::endgroup::",
      "::group::Restoring cache",
      "Cache not found",
      "::endgroup::",
      "::group::Installing dependencies",
      "::endgroup::",
      "::group::Saving cache",
      "::endgroup::",
    ]);

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

    expect(logs).toStrictEqual([
      "Enabling Yarn...",
      "::group::Getting cache key",
      "::endgroup::",
      "::group::Getting cache paths",
      "::endgroup::",
      "::group::Restoring cache",
      "::endgroup::",
      "Cache restored successfully",
    ]);

    expect(enableYarn).toHaveBeenCalledTimes(1);
    expect(getCacheKey).toHaveBeenCalledTimes(1);
    expect(getCachePaths).toHaveBeenCalledTimes(1);

    expect(restoreCache).toHaveBeenCalledTimes(1);
    expect(restoreCache).toHaveBeenCalledWith(cachePaths, cacheKey);

    expect(yarnInstall).toHaveBeenCalledTimes(0);
    expect(saveCache).toHaveBeenCalledTimes(0);
  });
});
