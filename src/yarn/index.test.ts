import { jest } from "@jest/globals";

jest.unstable_mockModule("@actions/exec", () => ({
  ...jest.requireActual<object>("@actions/exec"),
  getExecOutput: jest.fn(),
}));

it("should get Yarn config", async () => {
  const { getExecOutput } = await import("@actions/exec");
  const { getYarnConfig } = await import("./index.js");

  jest.mocked(getExecOutput).mockResolvedValueOnce({
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
