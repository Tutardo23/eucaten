import { rm } from "node:fs/promises";
import path from "node:path";

// Safe cleanup only. This script deliberately does not delete source files.
await rm(path.resolve(process.cwd(), ".next"), { recursive: true, force: true });
