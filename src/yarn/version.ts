import { getExecOutput } from "@actions/exec";

export async function getYarnVersion() {
  const res = await getExecOutput("corepack", ["yarn", "--version"], {
    silent: true,
  });
  return res.stdout.trim();
}
