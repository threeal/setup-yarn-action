import { exec, getExecOutput } from "@actions/exec";
import { jest } from "@jest/globals";

const mock = {
  exec: jest.fn<typeof exec>(),
  getExecOutput: jest.fn<typeof getExecOutput>(),
};

jest.unstable_mockModule("@actions/exec", () => ({
  exec: mock.exec,
  getExecOutput: mock.getExecOutput,
}));

beforeEach(() => {
  jest.clearAllMocks();
});

it("should disable Yarn global cache", async () => {
  const { exec } = await import("@actions/exec");
  const yarn = (await import("./yarn.js")).default;

  await yarn.disableGlobalCache();

  expect(exec).toHaveBeenCalledTimes(1);
  expect(exec).toHaveBeenCalledWith("corepack", [
    "yarn",
    "config",
    "set",
    "enableGlobalCache",
    "false",
  ]);
});

it("should enable Yarn", async () => {
  const yarn = (await import("./yarn.js")).default;

  await yarn.enable();

  expect(mock.exec).toHaveBeenCalledTimes(1);
  expect(mock.exec).toHaveBeenCalledWith("corepack", ["enable", "yarn"]);
});

it("should get Yarn config", async () => {
  const yarn = (await import("./yarn.js")).default;

  mock.getExecOutput.mockResolvedValueOnce({
    exitCode: 0,
    stdout: `{"key":"globalFolder","effective":"/.yarn/berry","source":"<default>","description":"Folder where all system-global files are stored","type":"ABSOLUTE_PATH","default":"/.yarn/berry"}\n`,
    stderr: "",
  });

  const value = await yarn.getConfig("globalFolder");

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

it("should install package using Yarn", async () => {
  const yarn = (await import("./yarn.js")).default;

  await yarn.install();

  expect(mock.exec).toHaveBeenCalledTimes(1);
  expect(mock.exec).toHaveBeenCalledWith("corepack", ["yarn", "install"], {
    env: {
      ...process.env,
      GITHUB_ACTIONS: "",
      FORCE_COLOR: "true",
      CI: "",
    },
  });
});

it("should get Yarn version", async () => {
  const yarn = (await import("./yarn.js")).default;

  mock.getExecOutput.mockResolvedValueOnce({
    exitCode: 0,
    stdout: "1.2.3",
    stderr: "",
  });

  const version = await yarn.version();

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
