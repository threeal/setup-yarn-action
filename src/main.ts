import { restoreCache, saveCache } from "cache-action";
import { getErrorMessage } from "catched-error-message";

import { getInput } from "ghakit/io";
import {
  beginLogGroup,
  endLogGroup,
  logError,
  logInfo,
  logWarning,
} from "ghakit/log";

import { getCacheKey, getCachePaths } from "./cache.js";
import { corepackAssertYarnVersion, corepackEnableYarn } from "./corepack.js";
import { setYarnVersion, yarnInstall } from "./yarn/index.js";

export async function main(): Promise<void> {
  const version = getInput("version");
  const cache = getInput("cache") === "true";

  logInfo("Enabling Yarn...");
  try {
    await corepackEnableYarn();
    if (version != "") {
      await setYarnVersion(version);
    }
    await corepackAssertYarnVersion();
  } catch (err) {
    logError(`Failed to enable Yarn: ${getErrorMessage(err)}`);
    process.exitCode = 1;
    return;
  }

  let cacheKey = { key: "", version: "" };
  if (cache) {
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

    logInfo("Restoring cache...");
    try {
      const cacheRestored = await restoreCache(cacheKey.key, cacheKey.version);
      if (cacheRestored) {
        logInfo("Cache restored successfully");
        return;
      } else {
        logWarning("Cache not found");
      }
    } catch (err) {
      logError(`Failed to restore cache: ${getErrorMessage(err)}`);
      process.exitCode = 1;
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

  if (cache) {
    beginLogGroup("Getting cache paths");
    let cachePaths: string[] = [];
    try {
      cachePaths = await getCachePaths();
    } catch (err) {
      endLogGroup();
      logError(`Failed to get cache paths: ${getErrorMessage(err)}`);
      process.exitCode = 1;
      return;
    }
    endLogGroup();

    logInfo("Saving cache...");
    try {
      await saveCache(cacheKey.key, cacheKey.version, cachePaths);
    } catch (err) {
      logError(`Failed to save cache: ${getErrorMessage(err)}`);
      process.exitCode = 1;
      return;
    }
  }
}
