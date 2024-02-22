import * as core from "@actions/core";
import { hashFile } from "hasha";
import fs from "node:fs";
import os from "node:os";
import { getYarnConfig, getYarnVersion } from "./yarn/index.js";

export async function getCacheKey(): Promise<string> {
  let cacheKey = `setup-yarn-action-${os.type()}`;

  core.info("Getting Yarn version...");
  try {
    const version = await getYarnVersion();
    cacheKey += `-${version}`;
  } catch (err) {
    core.setFailed(`Failed to get Yarn version: ${err.message}`);
    throw new Error("Failed to get Yarn version");
  }

  core.info("Calculating lock file hash...");
  try {
    if (fs.existsSync("yarn.lock")) {
      const hash = await hashFile("yarn.lock", { algorithm: "md5" });
      cacheKey += `-${hash}`;
    } else {
      core.warning(`Lock file could not be found, using empty hash`);
    }
  } catch (err) {
    core.setFailed(`Failed to calculate lock file hash: ${err.message}`);
    throw new Error("Failed to calculate lock file hash");
  }

  core.info(`Using cache key: ${cacheKey}`);
  return cacheKey;
}

export async function getCachePaths(): Promise<string[]> {
  const yarnConfigs = [
    { name: "Yarn cache folder", config: "cacheFolder" },
    { name: "Yarn deferred version folder", config: "deferredVersionFolder" },
    { name: "Yarn install state path", config: "installStatePath" },
    { name: "Yarn patch folder", config: "patchFolder" },
    { name: "Yarn PnP unplugged folder", config: "pnpUnpluggedFolder" },
    { name: "Yarn virtual folder", config: "virtualFolder" },
  ];

  const cachePaths = [".pnp.cjs", ".pnp.loader.mjs"];
  for (const { name, config } of yarnConfigs) {
    core.info(`Getting ${name}...`);
    cachePaths.push(await getYarnConfig(config));
  }
  core.info(`Using cache paths: ${JSON.stringify(cachePaths, null, 4)}`);

  return cachePaths;
}
