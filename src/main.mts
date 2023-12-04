import core from "@actions/core";
import { mkdirRecursive } from "./mkdir.mjs";

const path = core.getInput("path", { required: true });
mkdirRecursive(path);
