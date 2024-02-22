import { getBooleanInput } from "@actions/core";

export function getInputs() {
  return {
    cache: getBooleanInput("cache"),
  };
}
