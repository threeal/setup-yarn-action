import { exec, getExecOutput } from "@actions/exec";
import { getYarnVersion } from "./version.js";
export { yarnInstall } from "./install.js";
export { getYarnVersion } from "./version.js";

export async function enableYarn(): Promise<void> {
  await exec("corepack", ["enable", "yarn"], { silent: true });

  // Check if the `yarn` command is using the same version as the `corepack yarn` command.
  const version = await getYarnVersion();
  const corepackVersion = await getYarnVersion({ corepack: true });
  if (version != corepackVersion) {
    throw new Error(
      `The \`yarn\` command is using different version of Yarn, expected \`${corepackVersion}\` but got \`${version}\``,
    );
  }
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
