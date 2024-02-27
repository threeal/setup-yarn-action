import { getExecOutput } from "@actions/exec";

/**
 * Retrieves the value of a Yarn configuration.
 *
 * @param name - The name of the Yarn configuration.
 * @returns A promise resolving to the value of the Yarn configuration.
 */
export async function getYarnConfig(name: string): Promise<string> {
  const res = await getExecOutput("yarn", ["config", name, "--json"], {
    silent: true,
  });
  return JSON.parse(res.stdout).effective;
}
