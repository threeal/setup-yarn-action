import { exec, getExecOutput } from "@actions/exec";

/**
 * Get the current Yarn version.
 *
 * @param options.corepack - Whether to get the current Yarn version using Corepack or not.
 * @returns A promise resolving to the current Yarn version.
 */
export async function getYarnVersion(options?: {
  corepack: boolean;
}): Promise<string> {
  const commandLine = options?.corepack ? "corepack" : "yarn";
  const args = options?.corepack ? ["yarn", "--version"] : ["--version"];
  const res = await getExecOutput(commandLine, args, {
    silent: true,
  });
  return res.stdout.trim();
}

/**
 * Set the Yarn version.
 *
 * @param version - The new Yarn version to set.
 * @returns A promise that resolves to nothing.
 */
export async function setYarnVersion(version: string): Promise<void> {
  await exec("yarn", ["set", "version", version], { silent: true });
}
