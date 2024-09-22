import { jest } from "@jest/globals";

jest.unstable_mockModule("cache-action", () => ({
  restoreCache: jest.fn(),
  saveCache: jest.fn(),
}));

jest.unstable_mockModule("gha-utils", () => ({
  beginLogGroup: jest.fn(),
  endLogGroup: jest.fn(),
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarning: jest.fn(),
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
  let logs: unknown[] = [];

  beforeEach(async () => {
    const { restoreCache, saveCache } = await import("cache-action");
    const gha = await import("gha-utils");
    const { setYarnVersion, yarnInstall } = await import("./yarn/index.js");
    const { getCacheKey, getCachePaths } = await import("./cache.js");
    const { corepackEnableYarn } = await import("./corepack.js");
    const { getInputs } = await import("./inputs.js");

    process.exitCode = 0;
    logs = [];

    jest.mocked(restoreCache).mockImplementation(async (key, version) => {
      if (key == "some-key" && version == "some-version") {
        gha.logInfo(`Cache ${key} ${version} restored`);
        return true;
      }
      return false;
    });

    jest.mocked(saveCache).mockImplementation(async (key, version, files) => {
      for (const file of files) {
        gha.logInfo(`Compressing ${file}...`);
      }
      gha.logInfo(`Cache ${key} ${version} saved`);
      return true;
    });

    jest.mocked(gha.beginLogGroup).mockImplementation((name) => {
      logs.push(`::group::${name}`);
    });

    jest.mocked(gha.endLogGroup).mockImplementation(() => {
      logs.push("::endgroup::");
    });

    jest.mocked(gha.logError).mockImplementation((message) => {
      logs.push(message);
    });

    jest.mocked(gha.logInfo).mockImplementation((message) => {
      logs.push(message);
    });

    jest.mocked(gha.logWarning).mockImplementation((message) => {
      logs.push(message);
    });

    jest.mocked(corepackEnableYarn).mockImplementation(async () => {
      gha.logInfo("Yarn enabled");
    });

    jest.mocked(setYarnVersion).mockImplementation(async (version) => {
      gha.logInfo(`Yarn version set to ${version}`);
    });

    jest.mocked(yarnInstall).mockImplementation(async () => {
      gha.logInfo("Dependencies installed");
    });

    jest.mocked(getCacheKey).mockResolvedValue({
      key: "unavailable-key",
      version: "unavailable-version",
    });

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

    expect(process.exitCode).toBe(1);
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

    expect(process.exitCode).toBe(1);
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

    expect(process.exitCode).toBe(1);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
      "Enabling Yarn...",
      "Yarn enabled",
      "::group::Getting cache key",
      "::endgroup::",
      "Failed to get cache key: some error",
    ]);
  });

  it("should failed to restore cache", async () => {
    const { restoreCache } = await import("cache-action");
    const { main } = await import("./main.js");

    jest.mocked(restoreCache).mockRejectedValue(new Error("some error"));

    await main();

    expect(process.exitCode).toBe(1);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
      "Enabling Yarn...",
      "Yarn enabled",
      "::group::Getting cache key",
      "::endgroup::",
      "::group::Restoring cache",
      "::endgroup::",
      "Failed to restore cache: some error",
    ]);
  });

  it("should successfully restore cache without install and save", async () => {
    const { getCacheKey } = await import("./cache.js");
    const { main } = await import("./main.js");

    jest
      .mocked(getCacheKey)
      .mockResolvedValue({ key: "some-key", version: "some-version" });

    await main();

    expect(process.exitCode).toBe(0);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
      "Enabling Yarn...",
      "Yarn enabled",
      "::group::Getting cache key",
      "::endgroup::",
      "::group::Restoring cache",
      "Cache some-key some-version restored",
      "::endgroup::",
      "Cache restored successfully",
    ]);
  });

  it("should failed to install dependencies", async () => {
    const { yarnInstall } = await import("./yarn/index.js");
    const { main } = await import("./main.js");

    jest.mocked(yarnInstall).mockRejectedValue(new Error("some error"));

    await main();

    expect(process.exitCode).toBe(1);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
      "Enabling Yarn...",
      "Yarn enabled",
      "::group::Getting cache key",
      "::endgroup::",
      "::group::Restoring cache",
      "Cache not found",
      "::endgroup::",
      "::group::Installing dependencies",
      "::endgroup::",
      "Failed to install dependencies: some error",
    ]);
  });

  it("should failed to get cache paths", async () => {
    const { getCachePaths } = await import("./cache.js");
    const { main } = await import("./main.js");

    jest.mocked(getCachePaths).mockRejectedValue(new Error("some error"));

    await main();

    expect(process.exitCode).toBe(1);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
      "Enabling Yarn...",
      "Yarn enabled",
      "::group::Getting cache key",
      "::endgroup::",
      "::group::Restoring cache",
      "Cache not found",
      "::endgroup::",
      "::group::Installing dependencies",
      "Dependencies installed",
      "::endgroup::",
      "::group::Getting cache paths",
      "::endgroup::",
      "Failed to get cache paths: some error",
    ]);
  });

  it("should failed to save cache", async () => {
    const { saveCache } = await import("cache-action");
    const { main } = await import("./main.js");

    jest.mocked(saveCache).mockRejectedValue(new Error("some error"));

    await main();

    expect(process.exitCode).toBe(1);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
      "Enabling Yarn...",
      "Yarn enabled",
      "::group::Getting cache key",
      "::endgroup::",
      "::group::Restoring cache",
      "Cache not found",
      "::endgroup::",
      "::group::Installing dependencies",
      "Dependencies installed",
      "::endgroup::",
      "::group::Getting cache paths",
      "::endgroup::",
      "::group::Saving cache",
      "::endgroup::",
      "Failed to save cache: some error",
    ]);
  });

  it("should successfully install dependencies and save cache", async () => {
    const { main } = await import("./main.js");

    await main();

    expect(process.exitCode).toBe(0);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
      "Enabling Yarn...",
      "Yarn enabled",
      "::group::Getting cache key",
      "::endgroup::",
      "::group::Restoring cache",
      "Cache not found",
      "::endgroup::",
      "::group::Installing dependencies",
      "Dependencies installed",
      "::endgroup::",
      "::group::Getting cache paths",
      "::endgroup::",
      "::group::Saving cache",
      "Compressing some/path...",
      "Compressing another/path...",
      "Cache unavailable-key unavailable-version saved",
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

      expect(process.exitCode).toBe(1);
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

      expect(process.exitCode).toBe(0);
      expect(logs).toStrictEqual([
        "Getting action inputs...",
        "Enabling Yarn...",
        "Yarn enabled",
        "Setting Yarn version...",
        "Yarn version set to stable",
        "::group::Getting cache key",
        "::endgroup::",
        "::group::Restoring cache",
        "Cache not found",
        "::endgroup::",
        "::group::Installing dependencies",
        "Dependencies installed",
        "::endgroup::",
        "::group::Getting cache paths",
        "::endgroup::",
        "::group::Saving cache",
        "Compressing some/path...",
        "Compressing another/path...",
        "Cache unavailable-key unavailable-version saved",
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

      expect(process.exitCode).toBe(0);
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
