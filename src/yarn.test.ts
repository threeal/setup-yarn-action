import * as core from "@actions/core";
import { exec, getExecOutput } from "@actions/exec";
import { jest } from "@jest/globals";

const mock = {
  core: {
    error: jest.fn<typeof core.error>(),
    info: jest.fn<typeof core.info>(),
    warning: jest.fn<typeof core.warning>(),
  },
  exec: jest.fn<typeof exec>(),
  getExecOutput: jest.fn<typeof getExecOutput>(),
};

jest.unstable_mockModule("@actions/core", () => mock.core);

jest.unstable_mockModule("@actions/exec", () => ({
  exec: mock.exec,
  getExecOutput: mock.getExecOutput,
}));

beforeEach(() => {
  jest.clearAllMocks();
});

it("should enable Yarn", async () => {
  const { enableYarn } = await import("./yarn.js");

  await enableYarn();

  expect(mock.exec).toHaveBeenCalledTimes(1);
  expect(mock.exec).toHaveBeenCalledWith("corepack", ["enable", "yarn"]);
});

it("should get Yarn config", async () => {
  const { getYarnConfig } = await import("./yarn.js");

  mock.getExecOutput.mockResolvedValueOnce({
    exitCode: 0,
    stdout: `{"key":"globalFolder","effective":"/.yarn/berry","source":"<default>","description":"Folder where all system-global files are stored","type":"ABSOLUTE_PATH","default":"/.yarn/berry"}\n`,
    stderr: "",
  });

  const value = await getYarnConfig("globalFolder");

  expect(mock.getExecOutput).toHaveBeenCalledTimes(1);
  expect(mock.getExecOutput).toHaveBeenCalledWith(
    "corepack",
    ["yarn", "config", "globalFolder", "--json"],
    {
      silent: true,
    },
  );

  expect(value).toEqual("/.yarn/berry");
});

describe("print Yarn install package output", () => {
  it("should print info output", async () => {
    const { printYarnInstallOutput } = await import("./yarn.js");

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
    const { printYarnInstallOutput } = await import("./yarn.js");

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
    const { printYarnInstallOutput } = await import("./yarn.js");

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
  const { yarnInstall } = await import("./yarn.js");

  await yarnInstall();

  expect(mock.exec).toHaveBeenCalledTimes(1);
  expect(mock.exec.mock.calls[0]).toHaveLength(3);
  expect(mock.exec.mock.calls[0][0]).toBe("corepack");
  expect(mock.exec.mock.calls[0][1]).toEqual(["yarn", "install", "--json"]);
  expect(mock.exec.mock.calls[0][2]).toHaveProperty("env");
  expect(mock.exec.mock.calls[0][2].env).toEqual({
    ...process.env,
    GITHUB_ACTIONS: "",
    FORCE_COLOR: "true",
    CI: "",
  });
});

it("should get Yarn version", async () => {
  const { getYarnVersion } = await import("./yarn.js");

  mock.getExecOutput.mockResolvedValueOnce({
    exitCode: 0,
    stdout: "1.2.3",
    stderr: "",
  });

  const version = await getYarnVersion();

  expect(mock.getExecOutput).toHaveBeenCalledTimes(1);
  expect(mock.getExecOutput).toHaveBeenCalledWith(
    "corepack",
    ["yarn", "--version"],
    {
      silent: true,
    },
  );

  expect(version).toEqual("1.2.3");
});
