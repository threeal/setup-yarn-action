import * as core from "@actions/core";
import { exec, getExecOutput } from "@actions/exec";

export async function enableYarn(): Promise<void> {
  await exec("corepack", ["enable", "yarn"]);
}

export async function getYarnConfig(name: string): Promise<string> {
  const res = await getExecOutput(
    "corepack",
    ["yarn", "config", name, "--json"],
    {
      silent: true,
    },
  );
  return JSON.parse(res.stdout).effective;
}

export async function yarnInstall(): Promise<void> {
  const env = process.env as { [key: string]: string };

  // Prevent `yarn install` from outputting group log messages.
  env["GITHUB_ACTIONS"] = "";
  env["FORCE_COLOR"] = "true";

  // Prevent no lock file causing errors.
  env["CI"] = "";

  await exec("corepack", ["yarn", "install", "--json"], {
    env,
    silent: true,
    listeners: {
      stdline: (data) => {
        const info = JSON.parse(data);
        switch (info.type) {
          case "info":
            core.info(`${info.displayName}: ${info.indent}${info.data}`);
            break;
          case "warning":
            core.warning(`${info.data} (${info.displayName})`);
            break;
          case "error":
            core.error(`${info.data} (${info.displayName})`);
            break;
        }
      },
    },
  });
}

export async function getYarnVersion() {
  const res = await getExecOutput("corepack", ["yarn", "--version"], {
    silent: true,
  });
  return res.stdout.trim();
}
