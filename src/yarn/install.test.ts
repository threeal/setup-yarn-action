import { jest } from "@jest/globals";

jest.unstable_mockModule("@actions/core", () => ({
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
}));

jest.unstable_mockModule("@actions/exec", () => ({
  exec: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("print Yarn install package output", () => {
  it("should print info output", async () => {
    const core = await import("@actions/core");
    const { printYarnInstallOutput } = await import("./install.js");

    printYarnInstallOutput({
      type: "info",
      displayName: "YN0000",
      indent: ". ",
      data: "\u001b[1mYarn 4.1.0\u001b[22m",
    });

    expect(core.info).toHaveBeenCalledTimes(1);
    expect(core.info).toHaveBeenCalledWith(
      "YN0000: . \u001b[1mYarn 4.1.0\u001b[22m",
    );

    expect(core.warning).toHaveBeenCalledTimes(0);
    expect(core.error).toHaveBeenCalledTimes(0);
  });

  it("should print warning output", async () => {
    const core = await import("@actions/core");
    const { printYarnInstallOutput } = await import("./install.js");

    printYarnInstallOutput({
      type: "warning",
      displayName: "YN0000",
      indent: "│ ",
      data: "ESM support for PnP uses the experimental loader API and is therefore experimental",
    });

    expect(core.warning).toHaveBeenCalledTimes(1);
    expect(core.warning).toHaveBeenCalledWith(
      "ESM support for PnP uses the experimental loader API and is therefore experimental (YN0000)",
    );

    expect(core.info).toHaveBeenCalledTimes(0);
    expect(core.error).toHaveBeenCalledTimes(0);
  });

  it("should print error output", async () => {
    const core = await import("@actions/core");
    const { printYarnInstallOutput } = await import("./install.js");

    printYarnInstallOutput({
      type: "error",
      displayName: "YN0028",
      indent: ". ",
      data: "The lockfile would have been created by this install, which is explicitly forbidden.",
    });

    expect(core.error).toHaveBeenCalledTimes(1);
    expect(core.error).toHaveBeenCalledWith(
      "The lockfile would have been created by this install, which is explicitly forbidden. (YN0028)",
    );

    expect(core.info).toHaveBeenCalledTimes(0);
    expect(core.warning).toHaveBeenCalledTimes(0);
  });
});

it("should install package using Yarn", async () => {
  const core = await import("@actions/core");
  const { exec } = await import("@actions/exec");
  const { yarnInstall } = await import("./install.js");

  jest.mocked(exec).mockImplementation(async (commandLine, args, options) => {
    options?.listeners?.stdline(
      `{"type":"info","name":null,"displayName":"YN0000","indent":"","data":"└ Completed"}`,
    );
    return 0;
  });

  await yarnInstall();

  expect(exec).toHaveBeenCalledTimes(1);

  const execCall = jest.mocked(exec).mock.calls[0];
  expect(execCall).toHaveLength(3);
  expect(execCall[0]).toBe("yarn");
  expect(execCall[1]).toEqual(["install", "--json"]);

  expect(core.info).toHaveBeenCalledTimes(1);
  expect(core.info).toHaveBeenCalledWith("YN0000: └ Completed");
});
