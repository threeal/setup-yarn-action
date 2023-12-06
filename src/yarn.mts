import exec from "@actions/exec";

/**
 * Install dependencies using Yarn.
 */
export async function install(): Promise<void> {
  await exec.exec("yarn", ["install"]);
}
