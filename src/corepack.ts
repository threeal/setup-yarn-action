import { exec } from "@actions/exec";
import { getYarnVersion } from "./yarn/index.js";

/**
 * Enable Yarn using Corepack.
 *
 * This function makes Yarn available in the environment by using Corepack.
 * It also checks if the `yarn` command is updated to the correct version set by Corepack.
 *
 * @returns A promise that resolves to nothing.
 */
export async function corepackEnableYarn(): Promise<void> {
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
