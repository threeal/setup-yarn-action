import { exec } from "@actions/exec";
import { getYarnVersion } from "./yarn/index.js";

/**
 * Assert Yarn version enabled by Corepack.
 *
 * This function asserts whether Yarn is updated to the correct version set by Corepack.
 * It asserts the Yarn version by checking if the `yarn` command is using the same version as the `corepack yarn` command.
 *
 * @returns A promise that resolves to nothing.
 * @throws If the `yarn` command is using a different version of Yarn.
 */
export async function corepackAssertYarnVersion(): Promise<void> {
  const version = await getYarnVersion();
  const corepackVersion = await getYarnVersion({ corepack: true });
  if (version !== corepackVersion) {
    throw new Error(
      `The \`yarn\` command is using a different version of Yarn, expected \`${corepackVersion}\` but got \`${version}\``,
    );
  }
}

/**
 * Enable Yarn using Corepack.
 *
 * This function makes Yarn available in the environment by using Corepack.
 *
 * @returns A promise that resolves to nothing.
 */
export async function corepackEnableYarn(): Promise<void> {
  await exec("corepack", ["enable", "yarn"], { silent: true });
}
