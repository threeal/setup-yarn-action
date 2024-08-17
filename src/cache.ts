import { getErrorMessage } from "catched-error-message";
import { logError, logInfo, logWarning } from "gha-utils";
import { hashFile } from "hasha";
import fs from "node:fs";
import os from "node:os";
import { getYarnConfig, getYarnVersion } from "./yarn/index.js";

export async function getCacheKey(): Promise<string> {
  let cacheKey = `setup-yarn-action-${os.type()}`;

  logInfo("Getting Yarn version...");
  try {
    const version = await getYarnVersion({ corepack: true });
    cacheKey += `-${version}`;
  } catch (err) {
    logError(`Failed to get Yarn version: ${getErrorMessage(err)}`);
    throw new Error("Failed to get Yarn version");
  }

  logInfo("Calculating lock file hash...");
  try {
    if (fs.existsSync("yarn.lock")) {
      const hash = await hashFile("yarn.lock", { algorithm: "md5" });
      cacheKey += `-${hash}`;
    } else {
      logWarning(`Lock file could not be found, using empty hash`);
    }
  } catch (err) {
    logError(`Failed to calculate lock file hash: ${getErrorMessage(err)}`);
    throw new Error("Failed to calculate lock file hash");
  }

  logInfo(`Using cache key: ${cacheKey}`);
  return cacheKey;
}

export async function getCachePaths(): Promise<string[]> {
  const cachePaths = [".pnp.cjs", ".pnp.loader.mjs"];

  const yarnConfigs = [
    { name: "Yarn cache folder", config: "cacheFolder" },
    { name: "Yarn deferred version folder", config: "deferredVersionFolder" },
    { name: "Yarn install state path", config: "installStatePath" },
    { name: "Yarn patch folder", config: "patchFolder" },
    { name: "Yarn PnP unplugged folder", config: "pnpUnpluggedFolder" },
    { name: "Yarn virtual folder", config: "virtualFolder" },
  ];
  for (const { name, config } of yarnConfigs) {
    logInfo(`Getting ${name}...`);
    try {
      cachePaths.push(await getYarnConfig(config));
    } catch (err) {
      logError(`Failed to get ${name}: ${getErrorMessage(err)}`);
      throw new Error(`Failed to get ${name}`);
    }
  }

  logInfo(`Using cache paths: ${JSON.stringify(cachePaths, null, 4)}`);
  return cachePaths;
}
