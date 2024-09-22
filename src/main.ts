import { restoreCache, saveCache } from "cache-action";
import { getErrorMessage } from "catched-error-message";

import {
  beginLogGroup,
  endLogGroup,
  logError,
  logInfo,
  logWarning,
} from "gha-utils";

import { getCacheKey, getCachePaths } from "./cache.js";
import { corepackAssertYarnVersion, corepackEnableYarn } from "./corepack.js";
import { setYarnVersion, yarnInstall } from "./yarn/index.js";
import { getInputs, Inputs } from "./inputs.js";

export async function main(): Promise<void> {
  logInfo("Getting action inputs...");
  let inputs: Inputs;
  try {
    inputs = getInputs();
  } catch (err) {
    logError(`Failed to get action inputs: ${getErrorMessage(err)}`);
    process.exitCode = 1;
    return;
  }

  logInfo("Enabling Yarn...");
  try {
    await corepackEnableYarn();
    await corepackAssertYarnVersion();
  } catch (err) {
    logError(`Failed to enable Yarn: ${getErrorMessage(err)}`);
    process.exitCode = 1;
    return;
  }

  if (inputs.version != "") {
    logInfo("Setting Yarn version...");
    try {
      await setYarnVersion(inputs.version);
      await corepackAssertYarnVersion();
    } catch (err) {
      logError(`Failed to set Yarn version: ${getErrorMessage(err)}`);
      process.exitCode = 1;
      return;
    }
  }

  let cacheKey = { key: "", version: "" };
  let cachePaths: string[] = [];
  if (inputs.cache) {
    beginLogGroup("Getting cache key");
    try {
      cacheKey = await getCacheKey();
    } catch (err) {
      endLogGroup();
      logError(`Failed to get cache key: ${getErrorMessage(err)}`);
      process.exitCode = 1;
      return;
    }
    endLogGroup();

    beginLogGroup("Getting cache paths");
    try {
      cachePaths = await getCachePaths();
    } catch (err) {
      endLogGroup();
      logError(`Failed to get cache paths: ${getErrorMessage(err)}`);
      process.exitCode = 1;
      return;
    }
    endLogGroup();

    beginLogGroup("Restoring cache");
    let cacheRestored: boolean;
    try {
      cacheRestored = await restoreCache(cacheKey.key, cacheKey.version);
      if (!cacheRestored) {
        logWarning("Cache not found");
      }
    } catch (err) {
      endLogGroup();
      logError(`Failed to restore cache: ${getErrorMessage(err)}`);
      process.exitCode = 1;
      return;
    }
    endLogGroup();

    if (cacheRestored) {
      logInfo("Cache restored successfully");
      return;
    }
  }

  beginLogGroup("Installing dependencies");
  try {
    await yarnInstall();
  } catch (err) {
    endLogGroup();
    logError(`Failed to install dependencies: ${getErrorMessage(err)}`);
    process.exitCode = 1;
    return;
  }
  endLogGroup();

  if (inputs.cache) {
    beginLogGroup("Saving cache");
    try {
      await saveCache(cacheKey.key, cacheKey.version, cachePaths);
    } catch (err) {
      endLogGroup();
      logError(`Failed to save cache: ${getErrorMessage(err)}`);
      process.exitCode = 1;
      return;
    }
    endLogGroup();
  }
}
