import { jest } from "@jest/globals";

jest.unstable_mockModule("@actions/cache", () => ({
  restoreCache: jest.fn(),
  saveCache: jest.fn(),
}));

jest.unstable_mockModule("@actions/core", () => ({
  endGroup: jest.fn(),
  info: jest.fn(),
  setFailed: jest.fn(),
  startGroup: jest.fn(),
  warning: jest.fn(),
}));

jest.unstable_mockModule("./yarn/index.js", () => ({
  setYarnVersion: jest.fn(),
  yarnInstall: jest.fn(),
}));

jest.unstable_mockModule("./cache.js", () => ({
  getCacheKey: jest.fn(),
  getCachePaths: jest.fn(),
}));

jest.unstable_mockModule("./corepack.js", () => ({
  corepackAssertYarnVersion: jest.fn(),
  corepackEnableYarn: jest.fn(),
}));

jest.unstable_mockModule("./inputs.js", () => ({
  getInputs: jest.fn(),
}));

describe("install Yarn dependencies", () => {
  let failed: boolean = false;
  let logs: (string | Error)[] = [];

  beforeEach(async () => {
    const { restoreCache, saveCache } = await import("@actions/cache");
    const core = await import("@actions/core");
    const { setYarnVersion, yarnInstall } = await import("./yarn/index.js");
    const { getCacheKey, getCachePaths } = await import("./cache.js");
    const { corepackEnableYarn } = await import("./corepack.js");
    const { getInputs } = await import("./inputs.js");

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

    jest.mocked(core.endGroup).mockImplementation(() => {
      logs.push("::endgroup::");
    });

    jest.mocked(core.info).mockImplementation((message) => {
      logs.push(message);
    });

    jest.mocked(core.setFailed).mockImplementation((message) => {
      failed = true;
      logs.push(message);
    });

    jest.mocked(core.startGroup).mockImplementation((name) => {
      logs.push(`::group::${name}`);
    });

    jest.mocked(core.warning).mockImplementation((message) => {
      logs.push(message);
    });

    jest.mocked(corepackEnableYarn).mockImplementation(async () => {
      core.info("Yarn enabled");
    });

    jest.mocked(setYarnVersion).mockImplementation(async (version) => {
      core.info(`Yarn version set to ${version}`);
    });

    jest.mocked(yarnInstall).mockImplementation(async () => {
      core.info("Dependencies installed");
    });

    jest.mocked(getCacheKey).mockResolvedValue("unavailable-key");
    jest.mocked(getCachePaths).mockResolvedValue(["some/path", "another/path"]);

    jest.mocked(getInputs).mockReturnValue({ version: "", cache: true });
  });

  it("should failed to get action inputs", async () => {
    const { getInputs } = await import("./inputs.js");
    const { main } = await import("./main.js");

    jest.mocked(getInputs).mockImplementation(() => {
      throw new Error("some error");
    });

    await main();

    expect(failed).toBe(true);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
      "Failed to get action inputs: some error",
    ]);
  });

  it("should failed to enable Yarn", async () => {
    const { corepackEnableYarn } = await import("./corepack.js");
    const { main } = await import("./main.js");

    jest.mocked(corepackEnableYarn).mockRejectedValue(new Error("some error"));

    await main();

    expect(failed).toBe(true);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
      "Enabling Yarn...",
      "Failed to enable Yarn: some error",
    ]);
  });

  it("should failed to get cache key", async () => {
    const { getCacheKey } = await import("./cache.js");
    const { main } = await import("./main.js");

    jest.mocked(getCacheKey).mockRejectedValue(new Error("some error"));

    await main();

    expect(failed).toBe(true);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
      "Enabling Yarn...",
      "Yarn enabled",
      "::group::Getting cache key",
      "::endgroup::",
      "Failed to get cache key: some error",
    ]);
  });

  it("should failed to get cache paths", async () => {
    const { getCachePaths } = await import("./cache.js");
    const { main } = await import("./main.js");

    jest.mocked(getCachePaths).mockRejectedValue(new Error("some error"));

    await main();

    expect(failed).toBe(true);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
      "Enabling Yarn...",
      "Yarn enabled",
      "::group::Getting cache key",
      "::endgroup::",
      "::group::Getting cache paths",
      "::endgroup::",
      "Failed to get cache paths: some error",
    ]);
  });

  it("should failed to restore cache", async () => {
    const { restoreCache } = await import("@actions/cache");
    const { main } = await import("./main.js");

    jest.mocked(restoreCache).mockRejectedValue(new Error("some error"));

    await main();

    expect(failed).toBe(true);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
      "Enabling Yarn...",
      "Yarn enabled",
      "::group::Getting cache key",
      "::endgroup::",
      "::group::Getting cache paths",
      "::endgroup::",
      "::group::Restoring cache",
      "::endgroup::",
      "Failed to restore cache: some error",
    ]);
  });

  it("should successfully restore cache without install and save", async () => {
    const { getCacheKey } = await import("./cache.js");
    const { main } = await import("./main.js");

    jest.mocked(getCacheKey).mockResolvedValue("some-key");

    await main();

    expect(failed).toBe(false);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
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

  it("should failed to install dependencies", async () => {
    const { yarnInstall } = await import("./yarn/index.js");
    const { main } = await import("./main.js");

    jest.mocked(yarnInstall).mockRejectedValue(new Error("some error"));

    await main();

    expect(failed).toBe(true);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
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
      "::endgroup::",
      "Failed to install dependencies: some error",
    ]);
  });

  it("should failed to save cache", async () => {
    const { saveCache } = await import("@actions/cache");
    const { main } = await import("./main.js");

    jest.mocked(saveCache).mockRejectedValue(new Error("some error"));

    await main();

    expect(failed).toBe(true);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
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
      "::endgroup::",
      "Failed to save cache: some error",
    ]);
  });

  it("should successfully install dependencies and save cache", async () => {
    const { main } = await import("./main.js");

    await main();

    expect(failed).toBe(false);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
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

  describe("with version specified", () => {
    beforeEach(async () => {
      const { getInputs } = await import("./inputs.js");

      jest.mocked(getInputs).mockReturnValue({
        version: "stable",
        cache: true,
      });
    });

    it("should failed to set Yarn version", async () => {
      const { setYarnVersion } = await import("./yarn/index.js");
      const { main } = await import("./main.js");

      jest.mocked(setYarnVersion).mockRejectedValue(new Error("some error"));

      await main();

      expect(failed).toBe(true);
      expect(logs).toStrictEqual([
        "Getting action inputs...",
        "Enabling Yarn...",
        "Yarn enabled",
        "Setting Yarn version...",
        "Failed to set Yarn version: some error",
      ]);
    });

    it("should successfully install dependencies", async () => {
      const { main } = await import("./main.js");

      await main();

      expect(failed).toBe(false);
      expect(logs).toStrictEqual([
        "Getting action inputs...",
        "Enabling Yarn...",
        "Yarn enabled",
        "Setting Yarn version...",
        "Yarn version set to stable",
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
  });

  describe("with cache disabled", () => {
    beforeEach(async () => {
      const { getInputs } = await import("./inputs.js");

      jest.mocked(getInputs).mockReturnValue({ version: "", cache: false });
    });

    it("should successfully install dependencies", async () => {
      const { main } = await import("./main.js");

      await main();

      expect(failed).toBe(false);
      expect(logs).toStrictEqual([
        "Getting action inputs...",
        "Enabling Yarn...",
        "Yarn enabled",
        "::group::Installing dependencies",
        "Dependencies installed",
        "::endgroup::",
      ]);
    });
  });
});
