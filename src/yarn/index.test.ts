import { jest } from "@jest/globals";

jest.unstable_mockModule("@actions/exec", () => ({
  exec: jest.fn(),
  getExecOutput: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

it("should enable Yarn", async () => {
  const { exec } = await import("@actions/exec");
  const { enableYarn } = await import("./index.js");

  await enableYarn();

  expect(exec).toHaveBeenCalledTimes(1);
  expect(exec).toHaveBeenCalledWith("corepack", ["enable", "yarn"], {
    silent: true,
  });
});

it("should get Yarn config", async () => {
  const { getExecOutput } = await import("@actions/exec");
  const { getYarnConfig } = await import("./index.js");

  (getExecOutput as jest.Mock<typeof getExecOutput>).mockResolvedValueOnce({
    exitCode: 0,
    stdout: `{"key":"globalFolder","effective":"/.yarn/berry","source":"<default>","description":"Folder where all system-global files are stored","type":"ABSOLUTE_PATH","default":"/.yarn/berry"}\n`,
    stderr: "",
  });

  const value = await getYarnConfig("globalFolder");

  expect(getExecOutput).toHaveBeenCalledTimes(1);
  expect(getExecOutput).toHaveBeenCalledWith(
    "corepack",
    ["yarn", "config", "globalFolder", "--json"],
    {
      silent: true,
    },
  );

  expect(value).toEqual("/.yarn/berry");
});

it("should get Yarn version", async () => {
  const { getExecOutput } = await import("@actions/exec");
  const { getYarnVersion } = await import("./index.js");

  (getExecOutput as jest.Mock<typeof getExecOutput>).mockResolvedValueOnce({
    exitCode: 0,
    stdout: "1.2.3",
    stderr: "",
  });

  const version = await getYarnVersion();

  expect(getExecOutput).toHaveBeenCalledTimes(1);
  expect(getExecOutput).toHaveBeenCalledWith(
    "corepack",
    ["yarn", "--version"],
    {
      silent: true,
    },
  );

  expect(version).toEqual("1.2.3");
});
