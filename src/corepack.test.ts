import { jest } from "@jest/globals";

jest.unstable_mockModule("@actions/exec", () => ({
  exec: jest.fn(),
}));

jest.unstable_mockModule("./yarn/index.js", () => ({
  getYarnVersion: jest.fn(),
}));

describe("enable Yarn using Corepack", () => {
  beforeEach(async () => {
    const { getYarnVersion } = await import("./yarn/index.js");

    jest.mocked(getYarnVersion).mockResolvedValue("1.2.3");
  });

  it("should enable Yarn", async () => {
    const { exec } = await import("@actions/exec");
    const { corepackEnableYarn } = await import("./corepack.js");

    await expect(corepackEnableYarn()).resolves.toBeUndefined();

    expect(exec).toHaveBeenCalledTimes(1);
    expect(exec).toHaveBeenCalledWith("corepack", ["enable", "yarn"], {
      silent: true,
    });
  });

  describe("with different Yarn versions", () => {
    beforeEach(async () => {
      const { getYarnVersion } = await import("./yarn/index.js");

      jest.mocked(getYarnVersion).mockImplementation(async (options) => {
        return options?.corepack ? "1.2.3" : "1.2.4";
      });
    });

    it("should failed to enable Yarn", async () => {
      const { corepackEnableYarn } = await import("./corepack.js");

      await expect(corepackEnableYarn()).rejects.toThrow(
        "The `yarn` command is using different version of Yarn, expected `1.2.3` but got `1.2.4`",
      );
    });
  });
});
