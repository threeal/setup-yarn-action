import exec from "@actions/exec";

/**
 * Install dependencies using Yarn.
 */
export async function install(): Promise<void> {
  await exec.exec("corepack", ["enable", "yarn"]);
  await exec.exec("corepack", ["yarn", "install"]);
}
