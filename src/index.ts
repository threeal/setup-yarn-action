import * as core from "@actions/core";
import { main } from "./main.js";

main().catch((err) => core.setFailed(err));
