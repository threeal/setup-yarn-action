import { exec, getExecOutput } from "@actions/exec";
export { yarnInstall } from "./install.js";
export { getYarnVersion } from "./version.js";

export async function enableYarn(): Promise<void> {
  await exec("corepack", ["enable", "yarn"], { silent: true });
}

export async function getYarnConfig(name: string): Promise<string> {
  const res = await getExecOutput(
    "corepack",
    ["yarn", "config", name, "--json"],
    {
      silent: true,
    },
  );
  return JSON.parse(res.stdout).effective;
}
