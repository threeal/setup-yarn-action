import { jest } from "@jest/globals";

jest.unstable_mockModule("@actions/cache", () => ({
  restoreCache: jest.fn(),
  saveCache: jest.fn(),
}));

jest.unstable_mockModule("@actions/core", () => ({
  group: jest.fn(),
  info: jest.fn(),
  setFailed: jest.fn(),
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
  let failed: boolean = false;
  let logs: (string | Error)[] = [];

  beforeEach(async () => {
    const { restoreCache, saveCache } = await import("@actions/cache");
    const core = await import("@actions/core");
    const { enableYarn, yarnInstall } = await import("./yarn/index.js");
    const { getCachePaths } = await import("./cache.js");

    failed = false;
    logs = [];

    jest.mocked(restoreCache).mockImplementation(async (paths, primaryKey) => {
      if (primaryKey == "some-key") {
        for (const path of paths) {
          core.info(`Extracting ${path}...`);
        }
        core.info(`Cache ${primaryKey} restored`);
        return primaryKey;
      }
      return undefined;
    });

    jest.mocked(saveCache).mockImplementation(async (paths, key) => {
      for (const path of paths) {
        core.info(`Compressing ${path}...`);
      }
      core.info(`Cache ${key} saved`);
      return 0;
    });

    jest.mocked(core.group).mockImplementation(async (name, fn) => {
      logs.push(`::group::${name}`);
      const res = await fn();
      logs.push(`::endgroup::`);
      return res;
    });

    jest.mocked(core.info).mockImplementation((message) => {
      logs.push(message);
    });

    jest.mocked(core.setFailed).mockImplementation((message) => {
      failed = true;
      logs.push(message);
    });

    jest.mocked(core.warning).mockImplementation((message) => {
      logs.push(message);
    });

    jest.mocked(enableYarn).mockImplementation(async () => {
      core.info("Yarn enabled");
    });

    jest.mocked(yarnInstall).mockImplementation(async () => {
      core.info("Dependencies installed");
    });

    jest.mocked(getCachePaths).mockResolvedValue(["some/path", "another/path"]);
  });

  it("should install Yarn dependencies and save to cache", async () => {
    const { getCacheKey } = await import("./cache.js");
    const { main } = await import("./main.js");

    jest.mocked(getCacheKey).mockResolvedValue("unavailable-key");

    await main();

    expect(failed).toBe(false);
    expect(logs).toStrictEqual([
      "Enabling Yarn...",
      "Yarn enabled",
      "::group::Getting cache key",
      "::endgroup::",
      "::group::Getting cache paths",
      "::endgroup::",
      "::group::Restoring cache",
      "Cache not found",
      "::endgroup::",
      "::group::Installing dependencies",
      "Dependencies installed",
      "::endgroup::",
      "::group::Saving cache",
      "Compressing some/path...",
      "Compressing another/path...",
      "Cache unavailable-key saved",
      "::endgroup::",
    ]);
  });

  it("should restore Yarn dependencies cache without install and save", async () => {
    const { getCacheKey } = await import("./cache.js");
    const { main } = await import("./main.js");

    jest.mocked(getCacheKey).mockResolvedValue("some-key");

    await main();

    expect(failed).toBe(false);
    expect(logs).toStrictEqual([
      "Enabling Yarn...",
      "Yarn enabled",
      "::group::Getting cache key",
      "::endgroup::",
      "::group::Getting cache paths",
      "::endgroup::",
      "::group::Restoring cache",
      "Extracting some/path...",
      "Extracting another/path...",
      "Cache some-key restored",
      "::endgroup::",
      "Cache restored successfully",
    ]);
  });

  it("should failed to enable Yarn", async () => {
    const { enableYarn } = await import("./yarn/index.js");
    const { main } = await import("./main.js");

    jest.mocked(enableYarn).mockRejectedValue(new Error("some error"));

    await main();

    expect(failed).toBe(true);
    expect(logs).toStrictEqual([
      "Enabling Yarn...",
      "Failed to enable Yarn: some error",
    ]);
  });
});
