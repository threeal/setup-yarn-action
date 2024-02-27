import { jest } from "@jest/globals";
import path from "node:path";
import { homedir } from "node:os";
import "jest-extended";

jest.unstable_mockModule("@actions/exec", () => ({
  exec: jest.fn(),
}));

jest.unstable_mockModule("node:fs", () => ({
  mkdirSync: jest.fn(),
}));

jest.unstable_mockModule("./yarn/index.js", () => ({
  getYarnVersion: jest.fn(),
}));

describe("assert Yarn version enabled by Corepack", () => {
  it("should not throw an error if Yarn versions are the same", async () => {
    const { getYarnVersion } = await import("./yarn/index.js");
    const { corepackAssertYarnVersion } = await import("./corepack.js");

    jest.mocked(getYarnVersion).mockResolvedValue("1.2.3");

    await expect(corepackAssertYarnVersion()).resolves.toBeUndefined();
  });

  it("should throw an error if Yarn versions are different", async () => {
    const { getYarnVersion } = await import("./yarn/index.js");
    const { corepackAssertYarnVersion } = await import("./corepack.js");

    jest.mocked(getYarnVersion).mockImplementation(async (options) => {
      return options?.corepack ? "1.2.3" : "1.2.4";
    });

    await expect(corepackAssertYarnVersion()).rejects.toThrow(
      "The `yarn` command is using a different version of Yarn, expected `1.2.3` but got `1.2.4`",
    );
  });
});

describe("enable Yarn using Corepack", () => {
  it("should enable Yarn", async () => {
    const { exec } = await import("@actions/exec");
    const { mkdirSync } = await import("node:fs");
    const { corepackEnableYarn } = await import("./corepack.js");

    await expect(corepackEnableYarn()).resolves.toBeUndefined();
    const installDir = path.join(homedir(), ".corepack");

    expect(mkdirSync).toHaveBeenCalledExactlyOnceWith(installDir, {
      recursive: true,
    });
    expect(exec).toHaveBeenCalledAfter(jest.mocked(mkdirSync));
    expect(exec).toHaveBeenCalledExactlyOnceWith(
      "corepack",
      ["enable", "--install-directory", installDir, "yarn"],
      {
        silent: true,
      },
    );
  });
});
