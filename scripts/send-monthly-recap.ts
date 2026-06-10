import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");

for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq);
  const value = trimmed.slice(eq + 1);
  if (!process.env[key]) process.env[key] = value;
}

async function main() {
  const { runMonthlyRecap } = await import("../lib/monthly-recap");

  console.log("Sending monthly recap to all members...");

  const result = await runMonthlyRecap();

  console.log(JSON.stringify(result, null, 2));

  if (result.skipped) {
    console.log("Already sent for this month. Use force flag if needed.");
    process.exit(0);
  }

  if (result.error) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
