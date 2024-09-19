import { exec } from "@actions/exec";
import { addPath } from "gha-utils";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
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
 * This function enables Yarn using Corepack in the `.corepack` directory.
 * After enabling Yarn, it also adds the `.corepack` directory to the path.
 *
 * @returns A promise that resolves to nothing.
 */
export async function corepackEnableYarn(): Promise<void> {
  const corepackDir = path.join(homedir(), ".corepack");
  mkdirSync(corepackDir, { recursive: true });

  await exec(
    "corepack",
    ["enable", "--install-directory", corepackDir, "yarn"],
    { silent: true },
  );

  await addPath(corepackDir);
}
