import { exec } from "@actions/exec";

/**
 * Execute a Yarn command with the given arguments.
 *
 * This function executes the Yarn command silently, without outputting anything to the standard output.
 * Optionally, a callback can be provided to read the output from the command.
 *
 * @param args - The arguments of the Yarn command.
 * @param stdlineCallback - A callback to be called when receiving a line from the standard output.
 */
export async function execYarn(
  args?: string[],
  stdlineCallback?: (data: string) => void,
): Promise<void> {
  await exec("corepack", ["yarn", ...args], {
    silent: true,
    listeners: {
      stdline: stdlineCallback,
    },
  });
}
