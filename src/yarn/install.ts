import { exec } from "@actions/exec";
import { logError, logInfo, logWarning } from "gha-utils";

export interface YarnInstallOutput {
  type: "info" | "warning" | "error";
  displayName: string;
  indent: string;
  data: string;
}

export function printYarnInstallOutput(output: YarnInstallOutput): void {
  switch (output.type) {
    case "info":
      logInfo(`${output.displayName}: ${output.indent}${output.data}`);
      break;
    case "warning":
      logWarning(`${output.data} (${output.displayName})`);
      break;
    case "error":
      logError(`${output.data} (${output.displayName})`);
      break;
  }
}

export async function yarnInstall(): Promise<void> {
  await exec("yarn", ["install", "--json"], {
    silent: true,
    listeners: {
      stdline: (data) => {
        const output = JSON.parse(data) as YarnInstallOutput;
        printYarnInstallOutput(output);
      },
    },
  });
}
