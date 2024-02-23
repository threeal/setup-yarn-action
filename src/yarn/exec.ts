import { exec } from "@actions/exec";

/**
 * Execute a Yarn command with the given arguments.
 *
 * @param args - The arguments of the Yarn command.
 */
export async function execYarn(args?: string[]): Promise<void> {
  await exec("corepack", ["yarn", ...args], { silent: true });
}
