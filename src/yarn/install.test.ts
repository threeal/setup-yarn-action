import * as core from "@actions/core";
import { exec } from "@actions/exec";
import { jest } from "@jest/globals";

const mock = {
  core: {
    error: jest.fn<typeof core.error>(),
    info: jest.fn<typeof core.info>(),
    warning: jest.fn<typeof core.warning>(),
  },
  exec: jest.fn<typeof exec>(),
};

jest.unstable_mockModule("@actions/core", () => mock.core);

jest.unstable_mockModule("@actions/exec", () => ({
  exec: mock.exec,
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("print Yarn install package output", () => {
  it("should print info output", async () => {
    const { printYarnInstallOutput } = await import("./install.js");

    printYarnInstallOutput({
      type: "info",
      displayName: "YN0000",
      indent: ". ",
      data: "\u001b[1mYarn 4.1.0\u001b[22m",
    });

    expect(mock.core.info).toHaveBeenCalledTimes(1);
    expect(mock.core.info).toHaveBeenCalledWith(
      "YN0000: . \u001b[1mYarn 4.1.0\u001b[22m",
    );

    expect(mock.core.warning).toHaveBeenCalledTimes(0);
    expect(mock.core.error).toHaveBeenCalledTimes(0);
  });

  it("should print warning output", async () => {
    const { printYarnInstallOutput } = await import("./install.js");

    printYarnInstallOutput({
      type: "warning",
      displayName: "YN0000",
      indent: "│ ",
      data: "ESM support for PnP uses the experimental loader API and is therefore experimental",
    });

    expect(mock.core.warning).toHaveBeenCalledTimes(1);
    expect(mock.core.warning).toHaveBeenCalledWith(
      "ESM support for PnP uses the experimental loader API and is therefore experimental (YN0000)",
    );

    expect(mock.core.info).toHaveBeenCalledTimes(0);
    expect(mock.core.error).toHaveBeenCalledTimes(0);
  });

  it("should print error output", async () => {
    const { printYarnInstallOutput } = await import("./install.js");

    printYarnInstallOutput({
      type: "error",
      displayName: "YN0028",
      indent: ". ",
      data: "The lockfile would have been created by this install, which is explicitly forbidden.",
    });

    expect(mock.core.error).toHaveBeenCalledTimes(1);
    expect(mock.core.error).toHaveBeenCalledWith(
      "The lockfile would have been created by this install, which is explicitly forbidden. (YN0028)",
    );

    expect(mock.core.info).toHaveBeenCalledTimes(0);
    expect(mock.core.warning).toHaveBeenCalledTimes(0);
  });
});

it("should install package using Yarn", async () => {
  const { yarnInstall } = await import("./install.js");

  mock.exec.mockImplementation(async (commandLine, args, options) => {
    options?.listeners?.stdline(
      `{"type":"info","name":null,"displayName":"YN0000","indent":"","data":"└ Completed"}`,
    );
    return 0;
  });

  await yarnInstall();

  expect(mock.exec).toHaveBeenCalledTimes(1);
  expect(mock.exec.mock.calls[0]).toHaveLength(3);
  expect(mock.exec.mock.calls[0][0]).toBe("corepack");
  expect(mock.exec.mock.calls[0][1]).toEqual(["yarn", "install", "--json"]);

  expect(mock.core.info).toHaveBeenCalledTimes(1);
  expect(mock.core.info).toHaveBeenCalledWith("YN0000: └ Completed");
});
