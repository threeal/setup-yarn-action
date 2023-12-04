import * as path from "path";
import fs from "fs";
import { mkdirRecursive } from "./mkdir.mjs";
import os from "os";

describe("create directory", () => {
  const dirname = path.join(os.tmpdir(), "parent", "child");

  beforeAll(() => {
    fs.rmSync(dirname, { force: true, recursive: true });
  });
  afterAll(() => {
    fs.rmSync(dirname, { force: true, recursive: true });
  });

  it("should create a temporary directory", () => {
    fs.rmSync(dirname, { force: true, recursive: true });
    expect(fs.existsSync(dirname)).toBe(false);

    mkdirRecursive(dirname);
    expect(fs.existsSync(dirname)).toBe(true);
  });
});
