/**
 * Run the Fathom API and the Next.js app together.
 *
 * Next reads .env.local itself. This script also forwards AUTH_DEV_BYPASS and
 * NODE_ENV=development to uvicorn, which does not load .env.local. The bypass
 * stays off unless AUTH_DEV_BYPASS=1 is set in the environment or .env.local.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function readEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const fileEnv = { ...readEnvFile(".env"), ...readEnvFile(".env.local") };
const env = { ...fileEnv, ...process.env, NODE_ENV: "development" };
const uvicorn = existsSync("backend/.venv/bin/uvicorn")
  ? resolve("backend/.venv/bin/uvicorn")
  : "uvicorn";

const children = [];

function start(command, args, options) {
  const child = spawn(command, args, { stdio: "inherit", ...options });
  children.push(child);
  child.on("exit", (code, signal) => {
    if (signal) return;
    if (code && code !== 0) {
      shutdown(code);
    }
  });
  return child;
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

if (!existsSync("backend/.venv/bin/uvicorn")) {
  console.error(
    "Fathom API venv not found. From backend/: python3 -m venv .venv && .venv/bin/pip install -r requirements.txt",
  );
}

start(uvicorn, ["app.main:app", "--host", "127.0.0.1", "--port", "8741"], {
  cwd: "backend",
  env,
});

start("npm", ["run", "dev"], { env });
