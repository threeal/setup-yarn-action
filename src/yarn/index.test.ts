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

it("should enable Yarn", async () => {
  const { enableYarn } = await import("./index.js");

  await enableYarn();

  expect(mock.exec).toHaveBeenCalledTimes(1);
  expect(mock.exec).toHaveBeenCalledWith("corepack", ["enable", "yarn"]);
});

it("should get Yarn config", async () => {
  const { getYarnConfig } = await import("./index.js");

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

it("should get Yarn version", async () => {
  const { getYarnVersion } = await import("./index.js");

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
