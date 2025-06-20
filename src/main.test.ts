import { restoreCache, saveCache } from "cache-action";

import {
  beginLogGroup,
  endLogGroup,
  logError,
  logInfo,
  logWarning,
} from "gha-utils";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCacheKey, getCachePaths } from "./cache.js";
import { corepackEnableYarn } from "./corepack.js";
import { getInputs } from "./inputs.js";
import { main } from "./main.js";
import { setYarnVersion, yarnInstall } from "./yarn/index.js";

vi.mock("cache-action", () => ({
  restoreCache: vi.fn(),
  saveCache: vi.fn(),
}));

vi.mock("gha-utils", () => ({
  beginLogGroup: vi.fn(),
  endLogGroup: vi.fn(),
  logError: vi.fn(),
  logInfo: vi.fn(),
  logWarning: vi.fn(),
}));

vi.mock("./yarn/index.js", () => ({
  setYarnVersion: vi.fn(),
  yarnInstall: vi.fn(),
}));

vi.mock("./cache.js", () => ({
  getCacheKey: vi.fn(),
  getCachePaths: vi.fn(),
}));

vi.mock("./corepack.js", () => ({
  corepackAssertYarnVersion: vi.fn(),
  corepackEnableYarn: vi.fn(),
}));

vi.mock("./inputs.js", () => ({ getInputs: vi.fn() }));

describe("install Yarn dependencies", () => {
  let logs: unknown[] = [];

  beforeEach(() => {
    process.exitCode = 0;
    logs = [];

    vi.mocked(restoreCache).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/require-await
      async (key, version) => {
        return key == "some-key" && version == "some-version";
      },
    );

    vi.mocked(saveCache).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/require-await
      async (key, version) => {
        return key == "some-key" && version == "some-version";
      },
    );

    vi.mocked(beginLogGroup).mockImplementation((name) => {
      logs.push(`::group::${name}`);
    });

    vi.mocked(endLogGroup).mockImplementation(() => {
      logs.push("::endgroup::");
    });

    vi.mocked(logError).mockImplementation((message) => {
      logs.push(message);
    });

    vi.mocked(logInfo).mockImplementation((message) => {
      logs.push(message);
    });

    vi.mocked(logWarning).mockImplementation((message) => {
      logs.push(message);
    });

    vi.mocked(corepackEnableYarn).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/require-await
      async () => {
        logInfo("Yarn enabled");
      },
    );

    vi.mocked(setYarnVersion).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/require-await
      async (version) => {
        logInfo(`Yarn version set to ${version}`);
      },
    );

    vi.mocked(yarnInstall).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/require-await
      async () => {
        logInfo("Dependencies installed");
      },
    );

    vi.mocked(getCacheKey).mockResolvedValue({
      key: "unavailable-key",
      version: "unavailable-version",
    });

    vi.mocked(getCachePaths).mockResolvedValue(["some/path", "another/path"]);

    vi.mocked(getInputs).mockReturnValue({ version: "", cache: true });
  });

  it("should failed to get action inputs", async () => {
    vi.mocked(getInputs).mockImplementation(() => {
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
    vi.mocked(corepackEnableYarn).mockRejectedValue(new Error("some error"));

    await main();

    expect(process.exitCode).toBe(1);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
      "Enabling Yarn...",
      "Failed to enable Yarn: some error",
    ]);
  });

  it("should failed to get cache key", async () => {
    vi.mocked(getCacheKey).mockRejectedValue(new Error("some error"));

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
    vi.mocked(restoreCache).mockRejectedValue(new Error("some error"));

    await main();

    expect(process.exitCode).toBe(1);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
      "Enabling Yarn...",
      "Yarn enabled",
      "::group::Getting cache key",
      "::endgroup::",
      "Restoring cache...",
      "Failed to restore cache: some error",
    ]);
  });

  it("should successfully restore cache without install and save", async () => {
    vi.mocked(getCacheKey).mockResolvedValue({
      key: "some-key",
      version: "some-version",
    });

    await main();

    expect(process.exitCode).toBe(0);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
      "Enabling Yarn...",
      "Yarn enabled",
      "::group::Getting cache key",
      "::endgroup::",
      "Restoring cache...",
      "Cache restored successfully",
    ]);
  });

  it("should failed to install dependencies", async () => {
    vi.mocked(yarnInstall).mockRejectedValue(new Error("some error"));

    await main();

    expect(process.exitCode).toBe(1);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
      "Enabling Yarn...",
      "Yarn enabled",
      "::group::Getting cache key",
      "::endgroup::",
      "Restoring cache...",
      "Cache not found",
      "::group::Installing dependencies",
      "::endgroup::",
      "Failed to install dependencies: some error",
    ]);
  });

  it("should failed to get cache paths", async () => {
    vi.mocked(getCachePaths).mockRejectedValue(new Error("some error"));

    await main();

    expect(process.exitCode).toBe(1);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
      "Enabling Yarn...",
      "Yarn enabled",
      "::group::Getting cache key",
      "::endgroup::",
      "Restoring cache...",
      "Cache not found",
      "::group::Installing dependencies",
      "Dependencies installed",
      "::endgroup::",
      "::group::Getting cache paths",
      "::endgroup::",
      "Failed to get cache paths: some error",
    ]);
  });

  it("should failed to save cache", async () => {
    vi.mocked(saveCache).mockRejectedValue(new Error("some error"));

    await main();

    expect(process.exitCode).toBe(1);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
      "Enabling Yarn...",
      "Yarn enabled",
      "::group::Getting cache key",
      "::endgroup::",
      "Restoring cache...",
      "Cache not found",
      "::group::Installing dependencies",
      "Dependencies installed",
      "::endgroup::",
      "::group::Getting cache paths",
      "::endgroup::",
      "Saving cache...",
      "Failed to save cache: some error",
    ]);
  });

  it("should successfully install dependencies and save cache", async () => {
    await main();

    expect(process.exitCode).toBe(0);
    expect(logs).toStrictEqual([
      "Getting action inputs...",
      "Enabling Yarn...",
      "Yarn enabled",
      "::group::Getting cache key",
      "::endgroup::",
      "Restoring cache...",
      "Cache not found",
      "::group::Installing dependencies",
      "Dependencies installed",
      "::endgroup::",
      "::group::Getting cache paths",
      "::endgroup::",
      "Saving cache...",
    ]);
  });

  describe("with version specified", () => {
    beforeEach(() => {
      vi.mocked(getInputs).mockReturnValue({
        version: "stable",
        cache: true,
      });
    });

    it("should failed to set Yarn version", async () => {
      vi.mocked(setYarnVersion).mockRejectedValue(new Error("some error"));

      await main();

      expect(process.exitCode).toBe(1);
      expect(logs).toStrictEqual([
        "Getting action inputs...",
        "Enabling Yarn...",
        "Yarn enabled",
        "Failed to enable Yarn: some error",
      ]);
    });

    it("should successfully install dependencies", async () => {
      await main();

      expect(process.exitCode).toBe(0);
      expect(logs).toStrictEqual([
        "Getting action inputs...",
        "Enabling Yarn...",
        "Yarn enabled",
        "Yarn version set to stable",
        "::group::Getting cache key",
        "::endgroup::",
        "Restoring cache...",
        "Cache not found",
        "::group::Installing dependencies",
        "Dependencies installed",
        "::endgroup::",
        "::group::Getting cache paths",
        "::endgroup::",
        "Saving cache...",
      ]);
    });
  });

  describe("with cache disabled", () => {
    beforeEach(() => {
      vi.mocked(getInputs).mockReturnValue({ version: "", cache: false });
    });

    it("should successfully install dependencies", async () => {
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
