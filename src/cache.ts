import * as core from "@actions/core";
import { hashFile } from "hasha";
import fs from "node:fs";
import os from "node:os";
import yarn from "./yarn.js";

interface CacheInformation {
  key: string;
  paths: string[];
}

export async function getCacheInformation(): Promise<
  CacheInformation | undefined
> {
  const version = await core.group("Getting Yarn version", async () => {
    const version = await yarn.version();
    core.info(`Yarn version: ${version}`);
    return version;
  });

  const lockFileHash = await core.group(
    "Calculating lock file hash",
    async () => {
      if (!fs.existsSync("yarn.lock")) {
        core.warning(`Lock file not found, skipping cache`);
        return undefined;
      }
      const hash = await hashFile("yarn.lock", { algorithm: "md5" });
      core.info(`Hash: ${hash}`);
      return hash;
    },
  );

  if (lockFileHash == undefined) {
    return undefined;
  }

  return {
    key: `yarn-install-action-${os.type()}-${version}-${lockFileHash}`,
    paths: [
      await yarn.getConfig("cacheFolder"),
      await yarn.getConfig("deferredVersionFolder"),
      await yarn.getConfig("installStatePath"),
      await yarn.getConfig("patchFolder"),
      await yarn.getConfig("pnpUnpluggedFolder"),
      await yarn.getConfig("virtualFolder"),
      ".yarn",
      ".pnp.cjs",
      ".pnp.loader.mjs",
    ],
  };
}
