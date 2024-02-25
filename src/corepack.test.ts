import { jest } from "@jest/globals";

jest.unstable_mockModule("@actions/exec", () => ({
  exec: jest.fn(),
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
    const { corepackEnableYarn } = await import("./corepack.js");

    await expect(corepackEnableYarn()).resolves.toBeUndefined();

    expect(exec).toHaveBeenCalledTimes(1);
    expect(exec).toHaveBeenCalledWith("corepack", ["enable", "yarn"], {
      silent: true,
    });
  });
});
